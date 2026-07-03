import Foundation

// Mirrors shared/types.ts on the server. All payloads arrive as camelCase JSON.

struct Song: Codable, Identifiable, Equatable {
    let id: String
    let title: String
    let artist: String
    let year: Int
    var spotifyUri: String?
    var previewUrl: String?
    var albumCover: String?
    var movie: String?
    var trivia: String?
}

struct Placement: Codable, Equatable {
    let song: Song
    let position: Int
}

struct Player: Codable, Identifiable, Equatable {
    let id: String
    let name: String
    let timeline: [Song]
    let startYear: Int
    let score: Int
    let isReady: Bool
    let connected: Bool
    var persistentId: String?
    var profileId: String?
    var artistName: String?
    var avatarColor: String?
    var profileImage: String?
    var currentPlacement: Placement?
}

struct YearRange: Codable, Equatable {
    let min: Int
    let max: Int
}

enum Phase: String, Codable {
    case setup, lobby, playing, reveal, finished
}

struct GameState: Codable, Equatable {
    let id: String
    let masterSocketId: String
    let players: [Player]
    let currentSong: Song?
    let songs: [Song]
    let phase: Phase
    let musicPreferences: String
    let searchQuery: String
    let roundNumber: Int
    let winner: Player?
    var startYearRange: YearRange?
}

struct RoundResult: Codable, Identifiable {
    let playerId: String
    let playerName: String
    let correct: Bool
    let placedAt: Int
    let correctYear: Int
    var id: String { playerId }
}

// AI chat over HTTP POST /api/chat

struct ChatMessage: Codable, Identifiable, Equatable {
    let role: String // "user" | "assistant"
    let content: String
    var id: String { "\(role)-\(content.hashValue)" }
}

struct SongSuggestion: Codable, Equatable {
    let title: String
    let artist: String
    let year: Int
    var movie: String?
    var trivia: String?
}

struct ChatResponse: Codable {
    let response: String
    let songs: [SongSuggestion]
    var startYearRange: YearRange?
}

// Spotify Connect devices (GET /v1/me/player/devices)

struct SpotifyDevice: Codable, Identifiable, Equatable {
    let id: String?
    let name: String
    let type: String
    let isActive: Bool

    enum CodingKeys: String, CodingKey {
        case id, name, type
        case isActive = "is_active"
    }
}

struct SpotifyDevicesResponse: Codable {
    let devices: [SpotifyDevice]
}

func decodePayload<T: Decodable>(_ type: T.Type, from any: Any) -> T? {
    guard JSONSerialization.isValidJSONObject(any) else { return nil }
    guard let data = try? JSONSerialization.data(withJSONObject: any) else { return nil }
    return try? JSONDecoder().decode(type, from: data)
}
