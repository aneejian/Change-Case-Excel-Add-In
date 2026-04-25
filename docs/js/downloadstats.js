/**
 * Download Statistics Module
 * Fetches release data from GitHub API and populates download stats in the DOM.
 * Falls back to cached values when the API is unavailable (rate-limited, offline, etc.).
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

  var RELEASE_BASE =
    "https://github.com/aneejian/Change-Case-Excel-Add-In/releases/download/v3.0/";
  var FILE_NAME = "change_case_excel_addin";
  var API_URL =
    "https://api.github.com/repos/aneejian/Change-Case-Excel-Add-In/releases";

  // Last-known values — updated periodically so the page is never empty.
  // These are used when the GitHub API is rate-limited (403) or unreachable.
  var CACHED = {
    exe: { url: RELEASE_BASE + FILE_NAME + ".exe", downloads: 16190, name: FILE_NAME + ".exe" },
    zip: { url: RELEASE_BASE + FILE_NAME + ".zip", downloads: 3004,  name: FILE_NAME + ".zip" },
    rar: { url: RELEASE_BASE + FILE_NAME + ".rar", downloads: 1486,  name: FILE_NAME + ".rar" }
  };

  $(function () {
    fetchReleaseData();
  });

  function fetchReleaseData() {
    $.getJSON(API_URL)
      .done(function (releases) {
        var stats = processReleases(releases);
        updateDOM(stats, false);
      })
      .fail(function () {
        // API unavailable — use cached values
        var total = CACHED.exe.downloads + CACHED.zip.downloads + CACHED.rar.downloads;
        updateDOM({
          total: total,
          exe: CACHED.exe,
          zip: CACHED.zip,
          rar: CACHED.rar
        }, true);
      });
  }

  function processReleases(releases) {
    var stats = {
      total: 0,
      exe: null,
      zip: null,
      rar: null
    };

    $.each(releases, function (_, release) {
      $.each(release.assets || [], function (_, asset) {
        var ext = asset.name.split(".").pop().toLowerCase();
        var info = {
          url: asset.browser_download_url,
          downloads: asset.download_count,
          name: asset.name
        };

        stats.total += asset.download_count;

        if (ext === "exe" && !stats.exe) { stats.exe = info; }
        else if (ext === "zip" && !stats.zip) { stats.zip = info; }
        else if (ext === "rar" && !stats.rar) { stats.rar = info; }
      });
    });

    // Fill in any missing assets with cached data
    if (!stats.exe) { stats.exe = CACHED.exe; }
    if (!stats.zip) { stats.zip = CACHED.zip; }
    if (!stats.rar) { stats.rar = CACHED.rar; }

    return stats;
  }

  function updateDOM(stats, isCached) {
    // Total downloads
    $("#totalDownloads").text(stats.total.toLocaleString());

    // Per-format file cards
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

    // Remove all loading spinners
    $(".stat-loader").remove();
  }

  function setFileCard(ext, data) {
    $("#" + ext + "Name").text(data.name);
    $("#" + ext + "Downloads").text(data.downloads.toLocaleString());
    $("#" + ext).attr("onclick", "window.location.href='" + data.url + "'");
  }
})();
