import SwiftUI

/// Winner screen styled like the web: congrats panel with the winner's
/// avatar on the left, final standings on the right, red New Game button.
struct WinnerView: View {
    @EnvironmentObject var client: GameClient

    var winner: Player? { client.gameState?.winner }
    var players: [Player] { (client.gameState?.players ?? []).sorted { $0.score > $1.score } }

    var body: some View {
        ZStack(alignment: .topLeading) {
            VStack(spacing: 28) {
                HStack(alignment: .top, spacing: 36) {
                    // Congrats panel
                    VStack(spacing: 20) {
                        Spacer(minLength: 0)
                        if let winner {
                            PlayerAvatar(player: winner, size: 240)
                            Text("CONGRATS!")
                                .font(BrandFont.heading(54))
                                .foregroundStyle(.white)
                            Text("✦ \(winner.name) ✦")
                                .font(BrandFont.heading(42))
                                .foregroundStyle(.red)
                            if let artist = winner.artistName {
                                Text("\"\(artist)\"")
                                    .font(BrandFont.body(28).italic())
                                    .foregroundStyle(.white.opacity(0.7))
                            }
                            Text("won the game!")
                                .font(BrandFont.bold(28))
                                .foregroundStyle(.white)
                        } else {
                            Text("🏆").font(.system(size: 120))
                            Text("GAME OVER")
                                .font(BrandFont.heading(54))
                                .foregroundStyle(.white)
                        }
                        Spacer(minLength: 0)
                    }
                    .frame(maxWidth: .infinity, maxHeight: .infinity)
                    .padding(40)
                    .brandPanel()

                    // Final standings panel
                    VStack(alignment: .leading, spacing: 22) {
                        Text("Final Standings")
                            .font(BrandFont.heading(40))
                            .foregroundStyle(.white)

                        ScrollView {
                            VStack(spacing: 16) {
                                ForEach(Array(players.enumerated()), id: \.element.id) { index, player in
                                    HStack(spacing: 18) {
                                        PlayerAvatar(player: player, size: 70)
                                        VStack(alignment: .leading, spacing: 4) {
                                            Text(player.name)
                                                .font(BrandFont.bold(30))
                                                .foregroundStyle(.white)
                                            if let artist = player.artistName {
                                                Text("\"\(artist)\"")
                                                    .font(BrandFont.body(22).italic())
                                                    .foregroundStyle(.white.opacity(0.6))
                                            }
                                        }
                                        Spacer()
                                        Text("\(player.score)")
                                            .font(BrandFont.mono(42))
                                            .foregroundStyle(.white)
                                    }
                                    .padding(20)
                                    .background(.white.opacity(0.05), in: RoundedRectangle(cornerRadius: 16))
                                    .overlay(
                                        RoundedRectangle(cornerRadius: 16)
                                            .stroke(index == 0 ? Color.red : Color.white.opacity(0.15), lineWidth: 2.5)
                                    )
                                }
                            }
                            .padding(4)
                        }
                        Spacer(minLength: 0)
                    }
                    .padding(36)
                    .frame(maxWidth: .infinity, maxHeight: .infinity)
                    .brandPanel()
                }

                Button {
                    client.newGame()
                } label: {
                    Text("NEW GAME")
                        .font(BrandFont.impact(40))
                        .kerning(2)
                        .foregroundStyle(.white)
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, 24)
                        .background(.red, in: RoundedRectangle(cornerRadius: 10))
                        .overlay(RoundedRectangle(cornerRadius: 10).stroke(.white, lineWidth: 3))
                        .focusHighlight()
                }
                .buttonStyle(.card)
            }
            .padding(.horizontal, 70)
            .padding(.vertical, 50)

            BrandLogo(height: 130)
                .padding(.leading, 30)
                .padding(.top, 10)
        }
    }
}
