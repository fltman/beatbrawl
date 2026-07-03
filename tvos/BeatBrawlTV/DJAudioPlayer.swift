import Foundation
import AVFoundation

/// Plays the base64-encoded MP3 DJ commentary sent over the socket.
final class DJAudioPlayer: NSObject, AVAudioPlayerDelegate {
    private var player: AVAudioPlayer?
    private var onFinish: (() -> Void)?

    func play(base64: String, onFinish: @escaping () -> Void) {
        guard let data = Data(base64Encoded: base64) else {
            onFinish()
            return
        }
        do {
            try AVAudioSession.sharedInstance().setCategory(.playback)
            try AVAudioSession.sharedInstance().setActive(true)
            let player = try AVAudioPlayer(data: data)
            player.delegate = self
            self.player = player
            self.onFinish = onFinish
            player.play()
        } catch {
            onFinish()
        }
    }

    func audioPlayerDidFinishPlaying(_ player: AVAudioPlayer, successfully flag: Bool) {
        let callback = onFinish
        onFinish = nil
        self.player = nil
        callback?()
    }
}
