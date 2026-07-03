import SwiftUI

/// Setup phase, styled like the web AIChat: black white-bordered AI bubbles on
/// the left, yellow user bubbles on the right, and a framed input panel with a
/// yellow send button and a big yellow confirm CTA at the bottom.
struct SetupView: View {
    @EnvironmentObject var client: GameClient
    @State private var input = ""

    private let greeting = "Hej! Jag är er AI-spelledare. Berätta vilken musik ni vill spela med – t.ex. \"80-tals rock\" eller \"svensk pop från 90-talet\"!"

    private let quickPicks = [
        "80-tals rock", "Svensk pop från 90-talet", "Filmmusik",
        "2000-tals hits", "Disco och funk", "Rock-klassiker"
    ]

    var body: some View {
        ZStack(alignment: .topLeading) {
            VStack(alignment: .leading, spacing: 22) {
                BrandLogo(height: 230)
                    .padding(.leading, 10)

                // Chat area
                ScrollViewReader { proxy in
                    ScrollView {
                        VStack(alignment: .leading, spacing: 26) {
                            ChatBubble(message: ChatMessage(role: "assistant", content: greeting))

                            ForEach(client.chatMessages) { message in
                                ChatBubble(message: message)
                                    .id(message.id)
                            }

                            if client.isChatLoading {
                                ProgressView()
                                    .tint(.white)
                                    .padding(.leading, 20)
                            }

                            if client.chatMessages.isEmpty {
                                // Quick picks: no typing needed on the TV
                                LazyVGrid(columns: [GridItem(.adaptive(minimum: 360), spacing: 20)], alignment: .leading, spacing: 20) {
                                    ForEach(quickPicks, id: \.self) { pick in
                                        Button {
                                            client.sendChatMessage(pick)
                                        } label: {
                                            ChipLabel(text: pick)
                                        }
                                        .buttonStyle(.card)
                                    }
                                }
                                .padding(.top, 10)
                            }
                        }
                        .padding(.vertical, 12)
                        .padding(.horizontal, 10)
                    }
                    .onChange(of: client.chatMessages) { _, messages in
                        if let last = messages.last {
                            withAnimation { proxy.scrollTo(last.id, anchor: .bottom) }
                        }
                    }
                }

                // Input panel, framed like the web app
                VStack(spacing: 22) {
                    HStack(spacing: 18) {
                        TextField("t.ex. '80-tals rock' eller 'svensk pop'", text: $input)
                            .font(BrandFont.body(28))
                            .onSubmit { send() }

                        Button {
                            send()
                        } label: {
                            Image(systemName: "paperplane.fill")
                                .font(.system(size: 30, weight: .bold))
                                .foregroundStyle(.black)
                                .padding(22)
                                .background(Color(red: 0.98, green: 0.8, blue: 0.08), in: RoundedRectangle(cornerRadius: 12))
                                .focusHighlight()
                        }
                        .buttonStyle(.card)
                    }

                    Button {
                        client.confirmPreferences()
                    } label: {
                        HStack(spacing: 16) {
                            if client.isConfirming {
                                ProgressView().tint(.black)
                            }
                            Text(client.isConfirming
                                 ? "LETAR UPP LÅTARNA..."
                                 : (client.generatedSongs.isEmpty
                                    ? "BEKRÄFTA & FORTSÄTT"
                                    : "BEKRÄFTA & FORTSÄTT – \(client.generatedSongs.count) LÅTAR REDO"))
                                .font(BrandFont.impact(38))
                                .kerning(2)
                                .foregroundStyle(.black)
                        }
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, 24)
                        .background(Color(red: 0.98, green: 0.8, blue: 0.08))
                        .opacity(client.lastPreference.isEmpty || client.isConfirming ? 0.45 : 1)
                        .focusHighlight()
                    }
                    .buttonStyle(.card)
                    .disabled(client.lastPreference.isEmpty || client.isConfirming)
                }
                .padding(28)
                .background(.black.opacity(0.85))
                .overlay(Rectangle().stroke(.white, lineWidth: 3))
                .frame(maxWidth: 1400)
                .frame(maxWidth: .infinity, alignment: .center)
            }
            .padding(.horizontal, 90)
            .padding(.vertical, 40)
        }
    }

    private func send() {
        client.sendChatMessage(input)
        input = ""
    }
}

/// Chat bubble matching the web app: assistant = black with white border on
/// the left, user = yellow with black text on the right.
struct ChatBubble: View {
    let message: ChatMessage

    var isUser: Bool { message.role == "user" }

    var body: some View {
        HStack {
            if isUser { Spacer(minLength: 300) }

            Text(message.content)
                .font(BrandFont.body(28))
                .foregroundStyle(isUser ? .black : .white)
                .padding(.horizontal, 30)
                .padding(.vertical, 22)
                .background(
                    isUser ? Color(red: 0.98, green: 0.8, blue: 0.08) : Color.black.opacity(0.88),
                    in: RoundedRectangle(cornerRadius: 22)
                )
                .overlay(
                    RoundedRectangle(cornerRadius: 22)
                        .stroke(isUser ? .clear : .white.opacity(0.9), lineWidth: 2)
                )

            if !isUser { Spacer(minLength: 300) }
        }
    }
}
