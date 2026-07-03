import SwiftUI

@main
struct BeatBrawlTVApp: App {
    @StateObject private var client = GameClient()

    var body: some Scene {
        WindowGroup {
            ContentView()
                .environmentObject(client)
                .environmentObject(client.spotify)
                .preferredColorScheme(.dark)
                .onAppear { client.connect() }
        }
    }
}
