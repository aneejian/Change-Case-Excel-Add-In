/**
 * Download Statistics Module
 * Fetches release data from GitHub API and populates download stats in the DOM.
 * 
 * Required DOM element IDs:
 *   #totalDownloads, #metricExe, #metricZip, #metricRar
 *   #exeName, #exeDownloads, #exe (button)
 *   #zipName, #zipDownloads, #zip (button)
 *   #rarName, #rarDownloads, #rar (button)
 *   #distExe, #distZip, #distRar (distribution bar segments)
 *   #distExePct, #distZipPct, #distRarPct (percentage labels)
 */
(function () {
  "use strict";

  var API_URL = "https://api.github.com/repos/aneejian/Change-Case-Excel-Add-In/releases";
  var RELEASE_BASE = "https://github.com/aneejian/Change-Case-Excel-Add-In/releases/download/v3.0/";
  var FILE_NAME = "change_case_excel_addin";

  // Fallback data used when API is unavailable (e.g. rate-limited)
  var fallbackData = {
    exe: { url: RELEASE_BASE + FILE_NAME + ".exe", downloads: 0, name: FILE_NAME + ".exe" },
    zip: { url: RELEASE_BASE + FILE_NAME + ".zip", downloads: 0, name: FILE_NAME + ".zip" },
    rar: { url: RELEASE_BASE + FILE_NAME + ".rar", downloads: 0, name: FILE_NAME + ".rar" }
  };

  $(function () {
    fetchReleaseData();
  });

  function fetchReleaseData() {
    $.getJSON(API_URL)
      .done(function (releases) {
        var stats = { total: 0, exe: null, zip: null, rar: null };

        // Process all releases and their assets
        $.each(releases, function (_, release) {
          $.each(release.assets || [], function (_, asset) {
            var ext = asset.name.split(".").pop().toLowerCase();
            var assetInfo = {
              url: asset.browser_download_url,
              downloads: asset.download_count,
              name: asset.name
            };

            stats.total += asset.download_count;

            // Keep the latest (first encountered) asset for each extension
            if (ext === "exe" && !stats.exe) { stats.exe = assetInfo; }
            else if (ext === "zip" && !stats.zip) { stats.zip = assetInfo; }
            else if (ext === "rar" && !stats.rar) { stats.rar = assetInfo; }
          });
        });

        // Use fallback for any missing assets
        if (!stats.exe) { stats.exe = fallbackData.exe; }
        if (!stats.zip) { stats.zip = fallbackData.zip; }
        if (!stats.rar) { stats.rar = fallbackData.rar; }

        updateDOM(stats);
      })
      .fail(function () {
        // API failed — use fallback data
        updateDOM({
          total: 0,
          exe: fallbackData.exe,
          zip: fallbackData.zip,
          rar: fallbackData.rar
        });
      });
  }

  function updateDOM(stats) {
    // Total downloads
    $("#totalDownloads").text(stats.total.toLocaleString());

    // Per-format details
    setFileCard("exe", stats.exe);
    setFileCard("zip", stats.zip);
    setFileCard("rar", stats.rar);

    // Metric cards
    $("#metricExe").text(stats.exe.downloads.toLocaleString());
    $("#metricZip").text(stats.zip.downloads.toLocaleString());
    $("#metricRar").text(stats.rar.downloads.toLocaleString());

    // Distribution bar
    if (stats.total > 0) {
      var exePct = ((stats.exe.downloads / stats.total) * 100).toFixed(1);
      var zipPct = ((stats.zip.downloads / stats.total) * 100).toFixed(1);
      var rarPct = ((stats.rar.downloads / stats.total) * 100).toFixed(1);

      setTimeout(function () {
        $("#distExe").css("width", exePct + "%");
        $("#distZip").css("width", zipPct + "%");
        $("#distRar").css("width", rarPct + "%");
      }, 400);

      $("#distExePct").text(exePct + "%");
      $("#distZipPct").text(zipPct + "%");
      $("#distRarPct").text(rarPct + "%");
    }
  }

  function setFileCard(ext, data) {
    $("#" + ext + "Name").text(data.name);
    $("#" + ext + "Downloads").text(data.downloads.toLocaleString());
    $("#" + ext).attr("onclick", "window.location.href='" + data.url + "'");
  }

})();
