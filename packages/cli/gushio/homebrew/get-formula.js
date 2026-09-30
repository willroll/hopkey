module.exports = (version, tarballUrl, tarballSha256) => `require "language/node"

class HopkeyCli < Formula
  desc "Install Hopkey CLI"
  homepage "https://github.com/willroll/hopkey"
  version "${version}"
  url "${tarballUrl}"
  sha256 "${tarballSha256}"

  depends_on "node"
  depends_on "libsecret"
  depends_on "python" => :build

  def install
    system "npm", "install", *Language::Node.std_npm_install_args(libexec).reject { |a| a == "--build-from-source" }
    bin.install_symlink Dir["#{libexec}/bin/*"]
  end

  test do
    system bin/"hopkey", "version"
  end
end`
