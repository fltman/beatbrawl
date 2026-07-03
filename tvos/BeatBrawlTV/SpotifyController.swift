import Foundation

/// Controls playback on a Spotify Connect device (e.g. the Spotify app on this
/// Apple TV) via the Spotify Web API. The access token comes from the game
/// server over the socket (see GameClient.fetchSpotifyToken).
///
/// Important: playback is never paused between rounds. A paused Spotify app in
/// the background on tvOS gets suspended and drops off Spotify Connect, which
/// breaks the next round. Instead the volume is ducked while the DJ speaks and
/// restored when the next track starts (radio style).
@MainActor
final class SpotifyController: ObservableObject {
    @Published var devices: [SpotifyDevice] = []
    @Published var selectedDeviceId: String? = UserDefaults.standard.string(forKey: "spotifyDeviceId")
    @Published var selectedDeviceName: String? = UserDefaults.standard.string(forKey: "spotifyDeviceName")
    @Published var isPlaying = false
    @Published var lastError: String?

    var tokenProvider: (() async -> String?)?

    private var normalVolume = 70
    private let duckedVolume = 8

    func selectDevice(_ device: SpotifyDevice) {
        selectedDeviceId = device.id
        selectedDeviceName = device.name
        UserDefaults.standard.set(device.id, forKey: "spotifyDeviceId")
        UserDefaults.standard.set(device.name, forKey: "spotifyDeviceName")
    }

    func refreshDevices() async {
        guard let token = await tokenProvider?() else { return }
        do {
            devices = try await fetchDevices(token: token)
        } catch {
            lastError = "Could not fetch Spotify devices"
        }
    }

    func play(trackId: String) async {
        guard selectedDeviceId != nil else {
            lastError = "No Spotify device selected"
            return
        }
        guard let token = await tokenProvider?() else { return }

        let status = await sendPlay(trackId: trackId, token: token)
        if status == 404 {
            // Device id went stale (e.g. the Spotify app re-registered).
            // Re-resolve by name and retry once.
            if await reresolveDevice(token: token) {
                _ = await sendPlay(trackId: trackId, token: token)
            } else {
                lastError = "Speaker not available - open Spotify on it and try again"
            }
        }
    }

    /// Lower the volume while the DJ talks, keeping playback (and the
    /// Spotify app) alive.
    func duck() async {
        guard isPlaying, let token = await tokenProvider?() else { return }
        // Remember the current volume so we can restore it later
        if let device = try? await fetchDevices(token: token).first(where: { $0.id == selectedDeviceId }),
           let volume = device.volumePercent, volume > duckedVolume {
            normalVolume = volume
        }
        await setVolume(duckedVolume, token: token)
    }

    func restoreVolume() async {
        guard let token = await tokenProvider?() else { return }
        await setVolume(normalVolume, token: token)
    }

    func pause() async {
        guard isPlaying, let deviceId = selectedDeviceId,
              let token = await tokenProvider?() else { return }
        do {
            var components = URLComponents(string: "https://api.spotify.com/v1/me/player/pause")!
            components.queryItems = [URLQueryItem(name: "device_id", value: deviceId)]
            var request = URLRequest(url: components.url!)
            request.httpMethod = "PUT"
            request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
            _ = try await URLSession.shared.data(for: request)
            isPlaying = false
        } catch {
            // Pausing is best-effort; playback stops anyway when a new track starts
        }
    }

    // MARK: - Internals

    private func fetchDevices(token: String) async throws -> [SpotifyDevice] {
        var request = URLRequest(url: URL(string: "https://api.spotify.com/v1/me/player/devices")!)
        request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        let (data, _) = try await URLSession.shared.data(for: request)
        return try JSONDecoder().decode(SpotifyDevicesResponse.self, from: data).devices
    }

    /// If the selected device re-registered under a new id (same name),
    /// update the selection. Returns true if a device is available again.
    private func reresolveDevice(token: String) async -> Bool {
        guard let list = try? await fetchDevices(token: token) else { return false }
        devices = list
        if let match = list.first(where: { $0.name == selectedDeviceName && $0.id != nil }) {
            selectDevice(match)
            return true
        }
        return false
    }

    @discardableResult
    private func sendPlay(trackId: String, token: String) async -> Int {
        guard let deviceId = selectedDeviceId else { return 0 }
        do {
            var components = URLComponents(string: "https://api.spotify.com/v1/me/player/play")!
            components.queryItems = [URLQueryItem(name: "device_id", value: deviceId)]
            var request = URLRequest(url: components.url!)
            request.httpMethod = "PUT"
            request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
            request.setValue("application/json", forHTTPHeaderField: "Content-Type")
            request.httpBody = try JSONSerialization.data(withJSONObject: ["uris": ["spotify:track:\(trackId)"]])

            let (_, response) = try await URLSession.shared.data(for: request)
            let status = (response as? HTTPURLResponse)?.statusCode ?? 0
            if status >= 400 {
                if status != 404 {
                    lastError = "Spotify could not play the track (code \(status))"
                }
            } else {
                isPlaying = true
                lastError = nil
            }
            return status
        } catch {
            lastError = "Spotify playback failed"
            return 0
        }
    }

    private func setVolume(_ percent: Int, token: String) async {
        guard let deviceId = selectedDeviceId else { return }
        var components = URLComponents(string: "https://api.spotify.com/v1/me/player/volume")!
        components.queryItems = [
            URLQueryItem(name: "volume_percent", value: String(percent)),
            URLQueryItem(name: "device_id", value: deviceId)
        ]
        var request = URLRequest(url: components.url!)
        request.httpMethod = "PUT"
        request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        _ = try? await URLSession.shared.data(for: request)
    }
}
