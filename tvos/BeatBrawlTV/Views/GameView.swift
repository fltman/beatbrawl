import SwiftUI

/// Playing + reveal phases: scoreboard on the left, song card on the right.
/// Mirrors the web master's GameControl layout.
struct GameView: View {
    @EnvironmentObject var client: GameClient
    @EnvironmentObject var spotify: SpotifyController

    var state: GameState? { client.gameState }
    var players: [Player] { (state?.players ?? []).sorted { $0.score > $1.score } }
    var connectedPlayers: [Player] { players.filter(\.connected) }

    var body: some View {
        HStack(alignment: .top, spacing: 50) {
            // Scoreboard
            VStack(alignment: .leading, spacing: 20) {
                ForEach(Array(players.enumerated()), id: \.element.id) { index, player in
                    HStack(spacing: 16) {
                        PlayerAvatar(player: player, size: 64)
                        VStack(alignment: .leading, spacing: 6) {
                            Text(player.name)
                                .font(BrandFont.bold(28))
                                .foregroundStyle(.white)
                            statusBadge(for: player)
                        }
                        Spacer()
                        Text("\(player.score)")
                            .font(BrandFont.mono(44))
                            .foregroundStyle(.white)
                    }
                    .padding(20)
                    .background(
                        index == 0 ? Color.red.opacity(0.15) : Color.white.opacity(0.05),
                        in: RoundedRectangle(cornerRadius: 20)
                    )
                    .opacity(player.connected ? 1 : 0.5)
                }
                Spacer()
            }
            .frame(width: 520)

            // Song card
            VStack(spacing: 30) {
                HStack {
                    Text("Runda \(state?.roundNumber ?? 0)")
                        .font(BrandFont.heading(32))
                        .foregroundStyle(.white)
                    Spacer()
                    Text("\(connectedPlayers.filter(\.isReady).count)/\(connectedPlayers.count) klara")
                        .font(BrandFont.bold(28))
                        .padding(.horizontal, 28)
                        .padding(.vertical, 12)
                        .background(.red, in: Capsule())
                        .foregroundStyle(.white)
                }

                if client.isDJPlaying {
                    DJOnAirView(song: state?.currentSong, results: client.results)
                } else if state?.phase == .playing {
                    MysterySongView(isPlaying: spotify.isPlaying)
                } else if state?.phase == .reveal, let song = state?.currentSong {
                    RevealView(song: song, results: client.results)
                }

                Spacer()
            }
            .frame(maxWidth: .infinity)
        }
        .padding(60)
        .overlay(alignment: .bottomTrailing) {
            Text("Kod: \(state?.id ?? "")")
                .font(BrandFont.mono(26))
                .foregroundStyle(.white.opacity(0.7))
                .padding(40)
        }
    }

    @ViewBuilder
    private func statusBadge(for player: Player) -> some View {
        if !player.connected {
            Label("Frånkopplad", systemImage: "wifi.slash")
                .font(BrandFont.bold(18))
                .foregroundStyle(.red)
        } else if player.isReady {
            Text("✓ Klar")
                .font(BrandFont.bold(18))
                .padding(.horizontal, 12)
                .padding(.vertical, 4)
                .background(.green, in: Capsule())
                .foregroundStyle(.white)
        } else {
            Text("Väntar...")
                .font(BrandFont.bold(18))
                .padding(.horizontal, 12)
                .padding(.vertical, 4)
                .background(.yellow, in: Capsule())
                .foregroundStyle(.black)
        }
    }
}

/// The hidden song ("?") shown while players place their cards.
struct MysterySongView: View {
    let isPlaying: Bool
    @State private var pulse = false

    var body: some View {
        VStack(spacing: 30) {
            Text("?")
                .font(BrandFont.heading(220))
                .foregroundStyle(.red.opacity(isPlaying ? 1 : 0.5))
                .scaleEffect(pulse ? 1.06 : 1.0)
                .animation(
                    isPlaying ? .easeInOut(duration: 0.8).repeatForever(autoreverses: true) : .default,
                    value: pulse
                )
            EqualizerView(isAnimating: isPlaying)
                .frame(height: 60)
        }
        .frame(maxWidth: .infinity)
        .padding(60)
        .background(.black.opacity(0.5), in: RoundedRectangle(cornerRadius: 32))
        .onAppear { pulse = true }
    }
}

/// Simple animated equalizer bars, like the web MusicEqualizer.
struct EqualizerView: View {
    let isAnimating: Bool
    @State private var phase = false

    var body: some View {
        HStack(spacing: 10) {
            ForEach(0..<7, id: \.self) { index in
                RoundedRectangle(cornerRadius: 4)
                    .fill(.red)
                    .frame(width: 12, height: phase ? heights[index] : heights[(index + 3) % 7])
                    .animation(
                        isAnimating
                            ? .easeInOut(duration: 0.4).repeatForever(autoreverses: true).delay(Double(index) * 0.07)
                            : .default,
                        value: phase
                    )
            }
        }
        .onAppear { phase = true }
        .opacity(isAnimating ? 1 : 0.3)
    }

    private var heights: [CGFloat] { [24, 48, 60, 36, 56, 30, 44] }
}

/// DJ commentary playing: song info + on-air indicator.
struct DJOnAirView: View {
    let song: Song?
    let results: [RoundResult]
    @State private var pulse = false

    var body: some View {
        VStack(spacing: 30) {
            VStack(spacing: 12) {
                Image(systemName: "dot.radiowaves.left.and.right")
                    .font(.system(size: 70))
                    .foregroundStyle(.red)
                    .opacity(pulse ? 1 : 0.4)
                    .animation(.easeInOut(duration: 0.7).repeatForever(autoreverses: true), value: pulse)
                Text("DJ ON AIR")
                    .font(BrandFont.impact(48))
                    .foregroundStyle(.red)
            }
            if let song {
                SongCard(song: song, results: results)
            }
        }
        .frame(maxWidth: .infinity)
        .padding(50)
        .background(.black.opacity(0.5), in: RoundedRectangle(cornerRadius: 32))
        .onAppear { pulse = true }
    }
}

/// Revealed song with round results.
struct RevealView: View {
    let song: Song
    let results: [RoundResult]

    var body: some View {
        VStack(spacing: 30) {
            SongCard(song: song, results: results)

            VStack(alignment: .leading, spacing: 14) {
                ForEach(results) { result in
                    HStack {
                        Image(systemName: result.correct ? "checkmark.circle.fill" : "xmark.circle.fill")
                            .foregroundStyle(result.correct ? .green : .red)
                        Text(result.playerName)
                            .foregroundStyle(.white)
                        Spacer()
                        Text(result.correct ? "Rätt!" : "Fel")
                            .foregroundStyle(result.correct ? .green : .red)
                    }
                    .font(BrandFont.bold(26))
                }
            }
            .padding(30)
            .background(.white.opacity(0.06), in: RoundedRectangle(cornerRadius: 24))
        }
        .frame(maxWidth: .infinity)
        .padding(40)
        .background(.black.opacity(0.5), in: RoundedRectangle(cornerRadius: 32))
    }
}

struct SongCard: View {
    let song: Song
    var results: [RoundResult] = []

    var body: some View {
        HStack(spacing: 30) {
            if let cover = song.albumCover, let url = Config.absoluteURL(cover) {
                AsyncImage(url: url) { image in
                    image.resizable().scaledToFill()
                } placeholder: {
                    Color.white.opacity(0.1)
                }
                .frame(width: 180, height: 180)
                .clipShape(RoundedRectangle(cornerRadius: 20))
            }
            VStack(alignment: .leading, spacing: 12) {
                Text(song.title)
                    .font(BrandFont.heading(36))
                    .foregroundStyle(.white)
                Text(song.artist)
                    .font(BrandFont.body(30))
                    .foregroundStyle(.white.opacity(0.7))
                HStack(spacing: 20) {
                    Text(String(song.year))
                        .font(BrandFont.mono(32))
                        .padding(.horizontal, 24)
                        .padding(.vertical, 8)
                        .background(.red, in: RoundedRectangle(cornerRadius: 12))
                        .foregroundStyle(.white)
                    if !results.isEmpty {
                        Text("\(results.filter(\.correct).count)/\(results.count) rätt")
                            .font(BrandFont.bold(28))
                            .foregroundStyle(.white)
                    }
                }
            }
            Spacer()
        }
        .padding(24)
        .background(.white.opacity(0.08), in: RoundedRectangle(cornerRadius: 24))
    }
}
