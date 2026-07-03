import Foundation

enum Config {
    /// Server URL. Override via UserDefaults key "serverURL" if needed.
    static var serverURL: URL {
        if let stored = UserDefaults.standard.string(forKey: "serverURL"),
           let url = URL(string: stored) {
            return url
        }
        return URL(string: "https://beatbrawl.bjarby.com")!
    }

    static func absoluteURL(_ path: String) -> URL? {
        if path.hasPrefix("http") || path.hasPrefix("data:") {
            return URL(string: path)
        }
        return URL(string: path, relativeTo: serverURL)
    }
}
