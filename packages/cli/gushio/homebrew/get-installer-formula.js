module.exports = (version, tarballUrl, tarballSha256) =>
  `class HopkeyCliDarwinArm64 < Formula
  desc "Install Hopkey CLI"
  homepage "https://leapp.cloud"
  version "${version}"
  url "${tarballUrl}"
  sha256 "${tarballSha256}"

  def install
    inreplace "bin/hopkey", /^CLIENT_HOME=/, "export HOPKEY_OCLIF_CLIENT_HOME=#{lib/"client"}\\nCLIENT_HOME="
    libexec.install Dir["*"]
    bin.install_symlink libexec/"bin/hopkey"
  end

  test do
    system bin/"hopkey", "version"
  end
end`
