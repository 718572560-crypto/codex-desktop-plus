using System.Diagnostics;

namespace CodexZhLauncher
{
    internal static class AppInfo
    {
        public const string Version = "0.8.2";
        public const string RepositoryUrl = "https://github.com/718572560-crypto/codex-desktop-plus";
        public const string FeedbackUrl = RepositoryUrl + "/issues/new/choose";
        public const string LatestReleaseUrl = RepositoryUrl + "/releases/latest";
        public const string SponsorUrl = "https://amggapi.cc/";

        public static void OpenUrl(string url)
        {
            Process.Start(new ProcessStartInfo
            {
                FileName = url,
                UseShellExecute = true
            });
        }
    }
}
