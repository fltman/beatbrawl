import SwiftUI

struct ContentView: View {
    @EnvironmentObject var client: GameClient

    var body: some View {
        ZStack {
            BrandBackground()

            switch client.gameState?.phase {
            case .none:
                VStack(spacing: 32) {
                    BrandLogo(height: 200)
                    ProgressView().tint(.white)
                    Text(client.isConnected ? "Creating game..." : "Connecting to \(Config.serverURL.host ?? "server")...")
                        .font(BrandFont.heading(32))
                        .foregroundStyle(.white)
                }
            case .setup:
                if client.isConfirming {
                    FindingTracksView()
                } else {
                    SetupView()
                }
            case .lobby:
                LobbyView()
            case .playing, .reveal:
                GameView()
            case .finished:
                WinnerView()
            }
        }
        .overlay(alignment: .bottomTrailing) {
            // Floating music toggle during setup/lobby, like the web master
            if client.gameState?.phase == .setup || client.gameState?.phase == .lobby {
                LobbyMusicButton(player: client.lobbyMusic)
                    .padding(40)
            }
        }
        .overlay(alignment: .top) {
            if let error = client.errorMessage {
                Text(error)
                    .font(BrandFont.bold(24))
                    .padding(.horizontal, 32)
                    .padding(.vertical, 16)
                    .background(.red, in: Capsule())
                    .foregroundStyle(.white)
                    .padding(.top, 40)
                    .task {
                        try? await Task.sleep(nanoseconds: 5_000_000_000)
                        client.errorMessage = nil
                    }
            }
        }
    }
}

/// Full-screen "finding tracks" state while Spotify search runs. Rotates
/// through the same playful wait messages as the web (4s interval).
struct FindingTracksView: View {
    @State private var messageIndex = 0

    private let messages = [
        "Finding immortal tracks!",
        "Feeling the vibe and digging through the records",
        "Mixing the perfect playlist",
        "Dropping beats from every decade",
        "Tracking down the classics",
        "Let AI choose the bangers"
    ]

    var body: some View {
        ZStack(alignment: .topLeading) {
            VStack(spacing: 50) {
                Text(messages[messageIndex].uppercased())
                    .font(BrandFont.impact(56))
                    .kerning(3)
                    .foregroundStyle(.black)
                    .multilineTextAlignment(.center)
                    .padding(.horizontal, 70)
                    .padding(.vertical, 40)
                    .background(Color(red: 0.98, green: 0.8, blue: 0.08), in: RoundedRectangle(cornerRadius: 30))
                    .overlay(RoundedRectangle(cornerRadius: 30).stroke(.white, lineWidth: 3))
                    .id(messageIndex)
                    .transition(.opacity.combined(with: .scale(scale: 0.96)))
                    .frame(maxWidth: 1500)

                ProgressView()
                    .tint(Color(red: 0.98, green: 0.8, blue: 0.08))
                    .scaleEffect(1.8)
            }
            .frame(maxWidth: .infinity, maxHeight: .infinity)

            BrandLogo(height: 280)
                .padding(60)
        }
        .task {
            while !Task.isCancelled {
                try? await Task.sleep(nanoseconds: 4_000_000_000)
                withAnimation(.easeInOut(duration: 0.4)) {
                    messageIndex = (messageIndex + 1) % messages.count
                }
            }
        }
    }
}

/// Floating speaker button that toggles the lobby music.
struct LobbyMusicButton: View {
    @ObservedObject var player: LobbyMusicPlayer

    var body: some View {
        Button {
            player.toggle()
        } label: {
            Image(systemName: player.isPlaying ? "speaker.wave.2.fill" : "speaker.slash.fill")
                .font(.system(size: 28, weight: .bold))
                .foregroundStyle(.white)
                .padding(24)
                .background(.black.opacity(0.8), in: Circle())
                .focusHighlight()
        }
        .buttonStyle(.card)
    }
}
