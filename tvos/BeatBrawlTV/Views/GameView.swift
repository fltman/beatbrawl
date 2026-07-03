import SwiftUI

/// Playing + reveal phases styled like the web master: "Game Code" header,
/// scoreboard panel on the left, song panel with ready badge on the right.
struct GameView: View {
    @EnvironmentObject var client: GameClient
    @EnvironmentObject var spotify: SpotifyController

    var state: GameState? { client.gameState }
    var players: [Player] { (state?.players ?? []).sorted { $0.score > $1.score } }
    var connectedPlayers: [Player] { players.filter(\.connected) }

    var body: some View {
        VStack(spacing: 24) {
            (Text("Game Code: ").font(BrandFont.body(30))
                + Text(state?.id ?? "").font(BrandFont.mono(32)))
                .foregroundStyle(.white)

            HStack(alignment: .top, spacing: 36) {
                // Scoreboard panel
                VStack(spacing: 18) {
                    ForEach(Array(players.enumerated()), id: \.element.id) { index, player in
                        HStack(spacing: 16) {
                            PlayerAvatar(player: player, size: 68, rank: index + 1)
                            VStack(alignment: .leading, spacing: 6) {
                                Text(player.name)
                                    .font(BrandFont.bold(28))
                                    .foregroundStyle(.white)
                                if let artist = player.artistName {
                                    Text(artist)
                                        .font(BrandFont.body(20).italic())
                                        .foregroundStyle(.white.opacity(0.6))
                                }
                                statusBadge(for: player)
                            }
                            Spacer()
                            Text("\(player.score)")
                                .font(BrandFont.mono(46))
                                .foregroundStyle(.white)
                        }
                        .padding(18)
                        .background(
                            index == 0 ? Color.red.opacity(0.1) : Color.white.opacity(0.04),
                            in: RoundedRectangle(cornerRadius: 18)
                        )
                        .overlay(
                            RoundedRectangle(cornerRadius: 18)
                                .stroke(index == 0 ? Color.red : Color.white.opacity(0.2), lineWidth: 2.5)
                        )
                        .opacity(player.connected ? 1 : 0.5)
                    }
                    Spacer(minLength: 0)
                }
                .padding(26)
                .frame(width: 560)
                .frame(maxHeight: .infinity)
                .brandPanel()

                // Song panel
                VStack(spacing: 26) {
                    HStack {
                        Spacer()
                        Text("\(connectedPlayers.filter(\.isReady).count)/\(connectedPlayers.count) ready")
                            .font(BrandFont.mono(28))
                            .foregroundStyle(.white)
                            .padding(.horizontal, 30)
                            .padding(.vertical, 14)
                            .background(.red, in: RoundedRectangle(cornerRadius: 10))
                            .overlay(RoundedRectangle(cornerRadius: 10).stroke(.white, lineWidth: 3))
                    }

                    if client.isDJPlaying {
                        DJOnAirView(song: state?.currentSong, results: client.results)
                    } else if state?.phase == .playing {
                        MysterySongView(isPlaying: spotify.isPlaying)
                    } else if state?.phase == .reveal, let song = state?.currentSong {
                        RevealView(song: song, results: client.results)
                    }

                    Spacer(minLength: 0)
                }
                .padding(32)
                .frame(maxWidth: .infinity, maxHeight: .infinity)
                .brandPanel()
            }
        }
        .padding(.horizontal, 70)
        .padding(.vertical, 44)
        .overlay(alignment: .topLeading) {
            BrandLogo(height: 140)
                .padding(.leading, 30)
                .padding(.top, 12)
        }
    }

    @ViewBuilder
    private func statusBadge(for player: Player) -> some View {
        if !player.connected {
            Label("Disconnected", systemImage: "wifi.slash")
                .font(BrandFont.bold(18))
                .foregroundStyle(.red)
        } else if player.isReady {
            Text("✓ Ready")
                .font(BrandFont.bold(18))
                .padding(.horizontal, 14)
                .padding(.vertical, 5)
                .background(.green, in: Capsule())
                .foregroundStyle(.white)
        } else {
            Text("Waiting...")
                .font(BrandFont.bold(18))
                .padding(.horizontal, 14)
                .padding(.vertical, 5)
                .background(Color(red: 0.98, green: 0.8, blue: 0.08), in: Capsule())
                .foregroundStyle(.black)
        }
    }
}

/// Inner white-bordered content frame used inside the song panel,
/// matching the web's nested rounded card.
private struct InnerSongFrame<Content: View>: View {
    @ViewBuilder let content: Content

    var body: some View {
        content
            .frame(maxWidth: .infinity)
            .padding(46)
            .background(Color(red: 0.12, green: 0.015, blue: 0.025), in: RoundedRectangle(cornerRadius: 26))
            .overlay(RoundedRectangle(cornerRadius: 26).stroke(.white, lineWidth: 3))
    }
}

/// The hidden song ("?") shown while players place their cards.
struct MysterySongView: View {
    let isPlaying: Bool
    @State private var pulse = false

    var body: some View {
        InnerSongFrame {
            VStack(spacing: 26) {
                Text("?")
                    .font(BrandFont.heading(190))
                    .foregroundStyle(.red.opacity(isPlaying ? 1 : 0.55))
                    .scaleEffect(pulse ? 1.06 : 1.0)
                    .animation(
                        isPlaying ? .easeInOut(duration: 0.8).repeatForever(autoreverses: true) : .default,
                        value: pulse
                    )
                EqualizerView(isAnimating: isPlaying)
                    .frame(height: 60)
            }
        }
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

/// DJ commentary playing: on-air indicator + revealed song, like the web.
struct DJOnAirView: View {
    let song: Song?
    let results: [RoundResult]
    @State private var pulse = false

    var body: some View {
        InnerSongFrame {
            VStack(spacing: 34) {
                VStack(spacing: 10) {
                    Image(systemName: "dot.radiowaves.left.and.right")
                        .font(.system(size: 64))
                        .foregroundStyle(.red)
                        .opacity(pulse ? 1 : 0.4)
                        .animation(.easeInOut(duration: 0.7).repeatForever(autoreverses: true), value: pulse)
                    Text("DJ ON AIR")
                        .font(BrandFont.impact(52))
                        .foregroundStyle(.red)
                        .kerning(3)
                }
                if let song {
                    SongCard(song: song, results: results)
                }
            }
        }
        .onAppear { pulse = true }
    }
}

/// Revealed song with per-player results.
struct RevealView: View {
    let song: Song
    let results: [RoundResult]

    var body: some View {
        InnerSongFrame {
            VStack(spacing: 26) {
                SongCard(song: song, results: results)

                VStack(alignment: .leading, spacing: 14) {
                    ForEach(results) { result in
                        HStack {
                            Image(systemName: result.correct ? "checkmark.circle.fill" : "xmark.circle.fill")
                                .foregroundStyle(result.correct ? .green : .red)
                            Text(result.playerName)
                                .foregroundStyle(.white)
                            Spacer()
                            Text(result.correct ? "Correct!" : "Wrong")
                                .foregroundStyle(result.correct ? .green : .red)
                        }
                        .font(BrandFont.bold(26))
                    }
                }
                .padding(26)
                .background(.white.opacity(0.06), in: RoundedRectangle(cornerRadius: 20))
            }
        }
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
                .frame(width: 170, height: 170)
                .clipShape(RoundedRectangle(cornerRadius: 18))
                .overlay(RoundedRectangle(cornerRadius: 18).stroke(.white, lineWidth: 3))
            }
            VStack(alignment: .leading, spacing: 12) {
                Text(song.title)
                    .font(BrandFont.heading(34))
                    .foregroundStyle(.white)
                Text(song.artist)
                    .font(BrandFont.body(28))
                    .foregroundStyle(.white.opacity(0.7))
                HStack(spacing: 20) {
                    Text(String(song.year))
                        .font(BrandFont.mono(30))
                        .padding(.horizontal, 24)
                        .padding(.vertical, 8)
                        .background(.red, in: RoundedRectangle(cornerRadius: 10))
                        .overlay(RoundedRectangle(cornerRadius: 10).stroke(.white, lineWidth: 3))
                        .foregroundStyle(.white)
                    if !results.isEmpty {
                        HStack(spacing: 8) {
                            Image(systemName: "checkmark.circle")
                                .foregroundStyle(.green)
                            Text("\(results.filter(\.correct).count)/\(results.count) correct")
                        }
                        .font(BrandFont.bold(26))
                        .foregroundStyle(.white)
                    }
                }
            }
            Spacer()
        }
        .padding(24)
        .background(.white.opacity(0.08), in: RoundedRectangle(cornerRadius: 22))
    }
}
