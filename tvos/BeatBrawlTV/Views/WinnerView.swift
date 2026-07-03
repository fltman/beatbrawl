import SwiftUI

struct WinnerView: View {
    @EnvironmentObject var client: GameClient

    var winner: Player? { client.gameState?.winner }
    var players: [Player] { (client.gameState?.players ?? []).sorted { $0.score > $1.score } }

    var body: some View {
        VStack(spacing: 40) {
            Text("🏆")
                .font(.system(size: 140))

            if let winner {
                VStack(spacing: 16) {
                    Text(winner.name)
                        .font(.system(size: 80, weight: .black))
                        .foregroundStyle(.yellow)
                    Text("VINNER!")
                        .font(.system(size: 44, weight: .black))
                        .foregroundStyle(.white)
                        .kerning(6)
                }
            }

            VStack(spacing: 14) {
                ForEach(Array(players.enumerated()), id: \.element.id) { index, player in
                    HStack(spacing: 20) {
                        Text("\(index + 1).")
                            .font(.title2.monospaced().weight(.black))
                            .foregroundStyle(.white.opacity(0.6))
                        PlayerAvatar(player: player, size: 50)
                        Text(player.name)
                            .font(.title2.weight(.bold))
                            .foregroundStyle(.white)
                        Spacer()
                        Text("\(player.score)")
                            .font(.title.monospaced().weight(.black))
                            .foregroundStyle(.white)
                    }
                }
            }
            .frame(maxWidth: 800)
            .padding(40)
            .background(.white.opacity(0.06), in: RoundedRectangle(cornerRadius: 28))

            Button {
                client.newGame()
            } label: {
                Text("NYTT SPEL")
                    .font(.title.weight(.black))
            }
        }
        .padding(80)
    }
}
