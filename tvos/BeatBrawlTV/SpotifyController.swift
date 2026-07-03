import Foundation

/// Controls playback on a Spotify Connect device (e.g. the Spotify app on this
/// Apple TV) via the Spotify Web API. The access token comes from the game
/// server over the socket (see GameClient.fetchSpotifyToken).
@MainActor
final class SpotifyController: ObservableObject {
    @Published var devices: [SpotifyDevice] = []
    @Published var selectedDeviceId: String? = UserDefaults.standard.string(forKey: "spotifyDeviceId")
    @Published var selectedDeviceName: String? = UserDefaults.standard.string(forKey: "spotifyDeviceName")
    @Published var isPlaying = false
    @Published var lastError: String?

    var tokenProvider: (() async -> String?)?

    func selectDevice(_ device: SpotifyDevice) {
        selectedDeviceId = device.id
        selectedDeviceName = device.name
        UserDefaults.standard.set(device.id, forKey: "spotifyDeviceId")
        UserDefaults.standard.set(device.name, forKey: "spotifyDeviceName")
    }

    func refreshDevices() async {
        guard let token = await tokenProvider?() else { return }
        do {
            var request = URLRequest(url: URL(string: "https://api.spotify.com/v1/me/player/devices")!)
            request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
            let (data, _) = try await URLSession.shared.data(for: request)
            let response = try JSONDecoder().decode(SpotifyDevicesResponse.self, from: data)
            devices = response.devices
        } catch {
            lastError = "Kunde inte hämta Spotify-enheter"
        }
    }

    func play(trackId: String) async {
        guard let deviceId = selectedDeviceId else {
            lastError = "Ingen Spotify-enhet vald"
            return
        }
        guard let token = await tokenProvider?() else { return }
        do {
            var components = URLComponents(string: "https://api.spotify.com/v1/me/player/play")!
            components.queryItems = [URLQueryItem(name: "device_id", value: deviceId)]
            var request = URLRequest(url: components.url!)
            request.httpMethod = "PUT"
            request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
            request.setValue("application/json", forHTTPHeaderField: "Content-Type")
            request.httpBody = try JSONSerialization.data(withJSONObject: ["uris": ["spotify:track:\(trackId)"]])

            let (_, response) = try await URLSession.shared.data(for: request)
            if let http = response as? HTTPURLResponse, http.statusCode >= 400 {
                lastError = "Spotify kunde inte spela låten (kod \(http.statusCode))"
            } else {
                isPlaying = true
                lastError = nil
            }
        } catch {
            lastError = "Spotify-uppspelning misslyckades"
        }
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
}
