import Foundation
import AVFoundation

/// Streams the web app's lobby music from the server during setup/lobby,
/// mirroring client/src/hooks/useLobbyMusic.ts (random order, no repeats
/// until every track has been played).
@MainActor
final class LobbyMusicPlayer: ObservableObject {
    @Published var isPlaying = false

    private static let tracks = [
        "Brooklyn concrete where legends are made.mp3",
        "Champions rise when the beat drops hard.mp3",
        "Cruising down the coast with the top lai.mp3",
        "Enter the chamber where the masters dwel.mp3",
        "Saturday night and the game is on.mp3",
        "South Central raised where the pain is r.mp3",
        "Standing in the basement where the cool .mp3",
        "Step inside the studio where the magic's.mp3",
        "Take it back to the essence, the golden .mp3",
        "Yeah, we bouncing down the one-way stree.mp3",
        "Yo, it's the doctrine from the bridge wh.mp3"
    ]

    private var player: AVPlayer?
    private var playedTracks: Set<String> = []
    private var endObserver: NSObjectProtocol?

    func play() {
        guard !isPlaying else { return }
        isPlaying = true
        playNextTrack()
    }

    func stop() {
        isPlaying = false
        player?.pause()
        player = nil
        removeEndObserver()
    }

    func toggle() {
        isPlaying ? stop() : play()
    }

    private func playNextTrack() {
        guard isPlaying else { return }

        if playedTracks.count >= Self.tracks.count {
            playedTracks.removeAll()
        }
        let unplayed = Self.tracks.filter { !playedTracks.contains($0) }
        guard let track = unplayed.randomElement() else { return }
        playedTracks.insert(track)

        guard let encoded = "music/\(track)".addingPercentEncoding(withAllowedCharacters: .urlPathAllowed),
              let url = URL(string: encoded, relativeTo: Config.serverURL) else { return }

        try? AVAudioSession.sharedInstance().setCategory(.playback)
        try? AVAudioSession.sharedInstance().setActive(true)

        let item = AVPlayerItem(url: url)
        let player = AVPlayer(playerItem: item)
        player.volume = 0.4
        self.player = player

        removeEndObserver()
        endObserver = NotificationCenter.default.addObserver(
            forName: .AVPlayerItemDidPlayToEndTime,
            object: item,
            queue: .main
        ) { [weak self] _ in
            Task { @MainActor in self?.playNextTrack() }
        }

        player.play()
    }

    private func removeEndObserver() {
        if let endObserver {
            NotificationCenter.default.removeObserver(endObserver)
            self.endObserver = nil
        }
    }
}
