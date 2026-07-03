import SwiftUI

struct ContentView: View {
    @EnvironmentObject var client: GameClient

    var body: some View {
        ZStack {
            BrandBackground()

            switch client.gameState?.phase {
            case .none:
                VStack(spacing: 24) {
                    ProgressView()
                    Text(client.isConnected ? "Skapar spel..." : "Ansluter till \(Config.serverURL.host ?? "servern")...")
                        .font(.title2.weight(.black))
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
                    .font(.headline)
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

/// Shared dark, energetic backdrop that echoes the web app's styling.
struct BrandBackground: View {
    var body: some View {
        LinearGradient(
            colors: [Color(red: 0.08, green: 0.02, blue: 0.03), Color(red: 0.25, green: 0.04, blue: 0.07)],
            startPoint: .top,
            endPoint: .bottom
        )
        .ignoresSafeArea()
    }
}

struct BrandTitle: View {
    var body: some View {
        Text("BEATBRAWL")
            .font(.system(size: 46, weight: .black))
            .foregroundStyle(.white)
            .kerning(4)
    }
}
