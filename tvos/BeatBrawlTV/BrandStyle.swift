import SwiftUI
import CoreText

/// Typography + visual identity matching the web app:
/// Poppins for headings/body, JetBrains Mono for years/scores,
/// compressed black (Impact-like) for big CTA buttons.
enum BrandFont {
    static func registerAll() {
        for name in ["Poppins-Black", "Poppins-Bold", "Poppins-Regular", "JetBrainsMono-Bold"] {
            if let url = Bundle.main.url(forResource: name, withExtension: "ttf") {
                CTFontManagerRegisterFontsForURL(url as CFURL, .process, nil)
            }
        }
    }

    static func heading(_ size: CGFloat) -> Font {
        UIFont(name: "Poppins-Black", size: size) != nil
            ? .custom("Poppins-Black", size: size)
            : .system(size: size, weight: .black)
    }

    static func bold(_ size: CGFloat) -> Font {
        UIFont(name: "Poppins-Bold", size: size) != nil
            ? .custom("Poppins-Bold", size: size)
            : .system(size: size, weight: .bold)
    }

    static func body(_ size: CGFloat) -> Font {
        UIFont(name: "Poppins-Regular", size: size) != nil
            ? .custom("Poppins-Regular", size: size)
            : .system(size: size)
    }

    static func mono(_ size: CGFloat) -> Font {
        UIFont(name: "JetBrainsMono-Bold", size: size) != nil
            ? .custom("JetBrainsMono-Bold", size: size)
            : .system(size: size, weight: .black, design: .monospaced)
    }

    /// Impact-style: the web app's CTA buttons (BEKRÄFTA, STARTA SPELET...)
    static func impact(_ size: CGFloat) -> Font {
        .system(size: size, weight: .black).width(.compressed)
    }
}

/// The web app's illustrated speaker background with dark overlay.
struct BrandBackground: View {
    var body: some View {
        GeometryReader { geo in
            if let image = UIImage(named: "background") {
                Image(uiImage: image)
                    .resizable()
                    .scaledToFill()
                    .frame(width: geo.size.width, height: geo.size.height)
                    .clipped()
                    .overlay(Color.black.opacity(0.45))
            } else {
                LinearGradient(
                    colors: [Color(red: 0.08, green: 0.02, blue: 0.03), Color(red: 0.25, green: 0.04, blue: 0.07)],
                    startPoint: .top,
                    endPoint: .bottom
                )
            }
        }
        .ignoresSafeArea()
    }
}

/// The BeatBrawl logo (falls back to styled text if the image is missing).
struct BrandLogo: View {
    var height: CGFloat = 130

    var body: some View {
        if let image = UIImage(named: "beatbrawl") {
            Image(uiImage: image)
                .resizable()
                .scaledToFit()
                .frame(height: height)
        } else {
            Text("BEATBRAWL")
                .font(BrandFont.heading(height * 0.4))
                .foregroundStyle(.white)
                .kerning(4)
        }
    }
}

/// Yellow all-caps CTA label, like the web app's confirm/start buttons.
/// Use inside a Button with .buttonStyle(.card) so tvOS adds the focus lift.
struct CTALabel: View {
    let text: String
    var size: CGFloat = 40
    @Environment(\.isEnabled) private var isEnabled

    var body: some View {
        Text(text.uppercased())
            .font(BrandFont.impact(size))
            .kerning(2)
            .foregroundStyle(.black)
            .padding(.horizontal, 56)
            .padding(.vertical, 22)
            .background(Color(red: 0.98, green: 0.8, blue: 0.08), in: RoundedRectangle(cornerRadius: 8))
            .opacity(isEnabled ? 1 : 0.35)
    }
}

extension View {
    /// Black panel with white border, like the web app's main cards.
    func brandPanel(cornerRadius: CGFloat = 28) -> some View {
        self
            .background(.black.opacity(0.92), in: RoundedRectangle(cornerRadius: cornerRadius))
            .overlay(RoundedRectangle(cornerRadius: cornerRadius).stroke(.white, lineWidth: 3))
    }
}

/// Yellow "license plate" game code, like the web lobby.
struct GameCodePlate: View {
    let code: String
    var size: CGFloat = 60

    var body: some View {
        Text(code)
            .font(BrandFont.mono(size))
            .foregroundStyle(.black)
            .padding(.horizontal, 44)
            .padding(.vertical, 12)
            .background(Color(red: 0.98, green: 0.8, blue: 0.08), in: RoundedRectangle(cornerRadius: 12))
            .overlay(RoundedRectangle(cornerRadius: 12).stroke(.white, lineWidth: 3))
    }
}

/// Small selectable chip (quick genre picks etc).
struct ChipLabel: View {
    let text: String

    var body: some View {
        Text(text)
            .font(BrandFont.bold(26))
            .foregroundStyle(.white)
            .padding(.horizontal, 32)
            .padding(.vertical, 14)
            .background(.white.opacity(0.14), in: Capsule())
            .overlay(Capsule().stroke(.white.opacity(0.4), lineWidth: 2))
    }
}
