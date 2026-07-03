import Foundation
import SocketIO

/// Master-side game client. Owns the socket connection and mirrors the
/// responsibilities of client/src/pages/MasterPage.tsx in the web app.
@MainActor
final class GameClient: ObservableObject {
    @Published var gameState: GameState?
    @Published var results: [RoundResult] = []
    @Published var isDJPlaying = false
    @Published var errorMessage: String?
    @Published var isConnected = false

    // AI chat (setup phase)
    @Published var chatMessages: [ChatMessage] = []
    @Published var generatedSongs: [SongSuggestion] = []
    @Published var lastPreference: String = ""
    @Published var startYearRange: YearRange?
    @Published var isChatLoading = false
    @Published var isConfirming = false

    let spotify = SpotifyController()

    private var manager: SocketManager?
    private var socket: SocketIOClient?
    private let djPlayer = DJAudioPlayer()

    func connect() {
        guard manager == nil else { return }

        let manager = SocketManager(
            socketURL: Config.serverURL,
            config: [.log(false), .compress, .reconnects(true)]
        )
        self.manager = manager
        let socket = manager.defaultSocket
        self.socket = socket

        spotify.tokenProvider = { [weak self] in
            await self?.fetchSpotifyToken()
        }

        socket.on(clientEvent: .connect) { [weak self] _, _ in
            Task { @MainActor in
                self?.isConnected = true
                // (Re)create the game whenever we get a fresh connection
                if self?.gameState == nil {
                    socket.emit("createGame")
                }
            }
        }

        socket.on(clientEvent: .disconnect) { [weak self] _, _ in
            Task { @MainActor in self?.isConnected = false }
        }

        socket.on("gameCreated") { [weak self] data, _ in
            guard let dict = data.first as? [String: Any],
                  let stateDict = dict["gameState"],
                  let state = decodePayload(GameState.self, from: stateDict) else { return }
            Task { @MainActor in self?.gameState = state }
        }

        socket.on("gameStateUpdate") { [weak self] data, _ in
            guard let first = data.first,
                  let state = decodePayload(GameState.self, from: first) else { return }
            Task { @MainActor in self?.gameState = state }
        }

        socket.on("gameStarted") { [weak self] data, _ in
            guard let first = data.first,
                  let state = decodePayload(GameState.self, from: first) else { return }
            Task { @MainActor in
                self?.gameState = state
                self?.results = []
                await self?.playCurrentSong()
            }
        }

        socket.on("roundStarted") { [weak self] data, _ in
            guard let first = data.first,
                  let state = decodePayload(GameState.self, from: first) else { return }
            Task { @MainActor in
                self?.gameState = state
                self?.results = []
                await self?.playCurrentSong()
            }
        }

        socket.on("resultsRevealed") { [weak self] data, _ in
            guard let dict = data.first as? [String: Any] else { return }
            let state = dict["gameState"].flatMap { decodePayload(GameState.self, from: $0) }
            let roundResults = dict["results"].flatMap { decodePayload([RoundResult].self, from: $0) }
            Task { @MainActor in
                if let state { self?.gameState = state }
                if let roundResults { self?.results = roundResults }
                await self?.spotify.pause()
            }
        }

        socket.on("djCommentary") { [weak self] data, _ in
            guard let base64 = data.first as? String else { return }
            Task { @MainActor in self?.playDJCommentary(base64) }
        }

        socket.on("playerDisconnected") { _, _ in
            // Game state update follows separately; nothing extra needed on TV
        }

        socket.on("error") { [weak self] data, _ in
            let message = data.first as? String ?? "Unknown error"
            Task { @MainActor in
                self?.errorMessage = message
                self?.isConfirming = false
            }
        }

        socket.connect()
    }

    func newGame() {
        socket?.disconnect()
        manager = nil
        socket = nil
        gameState = nil
        results = []
        chatMessages = []
        generatedSongs = []
        lastPreference = ""
        startYearRange = nil
        isConfirming = false
        connect()
    }

    // MARK: - Setup phase (AI chat over HTTP, like the web AIChat component)

    func sendChatMessage(_ text: String) {
        let trimmed = text.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !trimmed.isEmpty, !isChatLoading else { return }

        chatMessages.append(ChatMessage(role: "user", content: trimmed))
        lastPreference = trimmed
        isChatLoading = true

        Task {
            defer { isChatLoading = false }
            do {
                var request = URLRequest(url: Config.serverURL.appendingPathComponent("api/chat"))
                request.httpMethod = "POST"
                request.setValue("application/json", forHTTPHeaderField: "Content-Type")
                let history = chatMessages.dropLast().map { ["role": $0.role, "content": $0.content] }
                request.httpBody = try JSONSerialization.data(withJSONObject: [
                    "message": trimmed,
                    "conversationHistory": Array(history)
                ])

                let (data, _) = try await URLSession.shared.data(for: request)
                let chat = try JSONDecoder().decode(ChatResponse.self, from: data)

                chatMessages.append(ChatMessage(role: "assistant", content: chat.response))
                if !chat.songs.isEmpty {
                    generatedSongs = chat.songs
                    startYearRange = chat.startYearRange
                }
            } catch {
                errorMessage = "AI-chatten svarade inte. Försök igen."
            }
        }
    }

    func confirmPreferences() {
        guard !lastPreference.isEmpty, !isConfirming else { return }
        isConfirming = true

        if generatedSongs.isEmpty {
            socket?.emit("confirmPreferences", lastPreference)
            return
        }

        var payload: [String: Any] = [
            "preference": lastPreference,
            "songs": generatedSongs.map { song -> [String: Any] in
                var s: [String: Any] = ["title": song.title, "artist": song.artist, "year": song.year]
                if let movie = song.movie { s["movie"] = movie }
                if let trivia = song.trivia { s["trivia"] = trivia }
                return s
            }
        ]
        let range = startYearRange ?? YearRange(min: 1950, max: 2020)
        payload["startYearRange"] = ["min": range.min, "max": range.max]

        if let data = try? JSONSerialization.data(withJSONObject: payload),
           let json = String(data: data, encoding: .utf8) {
            socket?.emit("confirmPreferences", json)
        }
    }

    // MARK: - Game flow

    func startGame() {
        socket?.emit("startGame")
    }

    func revealResults() {
        socket?.emit("revealResults")
    }

    func nextRound() {
        socket?.emit("nextRound")
    }

    var joinURL: String {
        guard let code = gameState?.id else { return Config.serverURL.absoluteString }
        return Config.serverURL.appendingPathComponent("join/\(code)").absoluteString
    }

    // MARK: - Spotify

    private func fetchSpotifyToken() async -> String? {
        guard let socket else { return nil }
        return await withCheckedContinuation { continuation in
            socket.emitWithAck("getSpotifyToken").timingOut(after: 10) { data in
                guard let dict = data.first as? [String: Any],
                      let token = dict["accessToken"] as? String else {
                    let error = (data.first as? [String: Any])?["error"] as? String
                    Task { @MainActor [weak self] in
                        if let error { self?.errorMessage = error }
                    }
                    continuation.resume(returning: nil)
                    return
                }
                continuation.resume(returning: token)
            }
        }
    }

    private func playCurrentSong() async {
        guard let song = gameState?.currentSong, gameState?.phase == .playing, !isDJPlaying else { return }
        await spotify.play(trackId: song.id)
    }

    // MARK: - DJ commentary

    private func playDJCommentary(_ base64: String) {
        isDJPlaying = true
        Task { await spotify.pause() }

        djPlayer.play(base64: base64) { [weak self] in
            Task { @MainActor in
                guard let self else { return }
                self.isDJPlaying = false
                // Same auto-advance as the web master: wait, then next round unless finished
                try? await Task.sleep(nanoseconds: 1_500_000_000)
                if let phase = self.gameState?.phase, phase != .finished {
                    self.nextRound()
                }
            }
        }
    }
}
