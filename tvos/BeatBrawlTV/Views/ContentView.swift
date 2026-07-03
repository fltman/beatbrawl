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
                    Text(client.isConnected ? "Skapar spel..." : "Ansluter till \(Config.serverURL.host ?? "servern")...")
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

/// Full-screen "finding tracks" state while Spotify search runs,
/// like the web's FINDING IMMORTAL TRACKS! banner.
struct FindingTracksView: View {
    var body: some View {
        ZStack(alignment: .topLeading) {
            VStack(spacing: 50) {
                Text("LETAR UPP ODÖDLIGA LÅTAR!")
                    .font(BrandFont.impact(56))
                    .kerning(3)
                    .foregroundStyle(.black)
                    .padding(.horizontal, 70)
                    .padding(.vertical, 40)
                    .background(Color(red: 0.98, green: 0.8, blue: 0.08), in: RoundedRectangle(cornerRadius: 30))
                    .overlay(RoundedRectangle(cornerRadius: 30).stroke(.white, lineWidth: 3))

                ProgressView()
                    .tint(Color(red: 0.98, green: 0.8, blue: 0.08))
                    .scaleEffect(1.8)
            }
            .frame(maxWidth: .infinity, maxHeight: .infinity)

            BrandLogo(height: 280)
                .padding(60)
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
        }
        .buttonStyle(.card)
    }
}
