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
                SetupView()
            case .lobby:
                LobbyView()
            case .playing, .reveal:
                GameView()
            case .finished:
                WinnerView()
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
