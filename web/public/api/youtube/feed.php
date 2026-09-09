<?php
/**
 * The channel's recent videos, and whether it is live right now.
 *
 * Replaces the Elfsight widget the legacy site used. That was a paid
 * subscription that injected a third-party script into the page, loaded
 * YouTube on every visit whether or not anyone pressed play, and could not be
 * styled to match the site. This costs nothing, needs no API key and no
 * Google quota, and the page only talks to YouTube when a visitor actually
 * clicks a video.
 *
 * Two sources, both public:
 *
 *   1. The channel's RSS feed lists the 15 most recent videos. Small, fast,
 *      and it is the first thing that updates when a broadcast starts.
 *   2. A video's watch page carries liveBroadcastDetails.isLiveNow, which is
 *      the only reliable "on air right now" signal. /channel/<id>/live cannot
 *      be used for this - when nothing is live it quietly serves the most
 *      recent finished stream, which is exactly the case being tested for.
 *
 * The answer is cached, so a page of visitors costs one fetch, not one each.
 *
 * Read-only. Fetches two public URLs and returns JSON. Nothing is stored
 * about the visitor.
 */

declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');
header('X-Content-Type-Options: nosniff');
// Same-origin only; the page that consumes this is on this domain.
header('Cache-Control: public, max-age=60');

const CHANNEL_ID = 'UCxlvklqt9K0AMb4NV18jGsA';
const CACHE_TTL = 90;          // seconds
const MAX_LIVE_CHECKS = 2;     // watch pages fetched per refresh, at most
const LIVE_CANDIDATE_AGE = 43200; // only videos newer than 12h can be live

/** Cache above the web root where possible, else the system temp dir. */
function cache_path(): string
{
    $preferred = __DIR__ . '/../../../youtube-feed-cache.json';
    $dir = dirname($preferred);
    if (is_dir($dir) && is_writable($dir)) {
        return $preferred;
    }

    return rtrim(sys_get_temp_dir(), '/\\') . '/welm-youtube-feed.json';
}

function http_get(string $url, int $timeout = 12): ?string
{
    $ch = curl_init($url);
    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_FOLLOWLOCATION => true,
        CURLOPT_MAXREDIRS => 3,
        CURLOPT_TIMEOUT => $timeout,
        CURLOPT_CONNECTTIMEOUT => 6,
        CURLOPT_ENCODING => '',
        CURLOPT_USERAGENT => 'Mozilla/5.0 (compatible; WELM-site/1.0; +https://kingdomofgods.org)',
        CURLOPT_HTTPHEADER => ['Accept-Language: en'],
    ]);
    $body = curl_exec($ch);
    $status = (int) curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    if ($body === false || $status !== 200) {
        return null;
    }

    return (string) $body;
}

/**
 * Strip a leading live marker from a video title.
 *
 * "🔴 LIVE NOW | Lessons from the Beginning" -> "Lessons from the Beginning".
 * Only a marker at the START is removed, and only when a separator follows, so
 * a title that legitimately contains the word "live" is untouched.
 */
function clean_title(string $title): string
{
    $cleaned = preg_replace(
        '/^\s*(?:\x{1F534}|\x{25CF}|\x{2B24})?\s*LIVE(?:\s+NOW)?\s*[|\x{2013}\x{2014}:-]\s*/iu',
        '',
        $title
    );

    $cleaned = is_string($cleaned) ? trim($cleaned) : '';

    // Never return an empty title just because it was only a marker.
    return $cleaned !== '' ? $cleaned : trim($title);
}

/** The 15 most recent videos, newest first. */
function fetch_videos(string $channelId): array
{
    $xml = http_get('https://www.youtube.com/feeds/videos.xml?channel_id=' . urlencode($channelId));
    if ($xml === null) {
        return [];
    }

    $previous = libxml_use_internal_errors(true);
    $feed = simplexml_load_string($xml);
    libxml_use_internal_errors($previous);
    if ($feed === false) {
        return [];
    }

    $videos = [];
    foreach ($feed->entry as $entry) {
        $yt = $entry->children('http://www.youtube.com/xml/schemas/2015');
        $media = $entry->children('http://search.yahoo.com/mrss/');

        $id = (string) ($yt->videoId ?? '');
        if ($id === '') {
            continue;
        }

        $published = (string) ($entry->published ?? '');

        $rawTitle = (string) ($entry->title ?? '');

        $videos[] = [
            'id' => $id,
            // The channel titles broadcasts "🔴 LIVE NOW | ...", and that
            // wording sticks to the video forever once the stream ends. Shown
            // as-is it contradicts the page - "Not live at the moment. Most
            // recent: 🔴 LIVE NOW ...". Only the marker is removed; the title
            // the ministry wrote is kept, and the original is still sent.
            'title' => clean_title($rawTitle),
            'rawTitle' => $rawTitle,
            'published' => $published,
            'publishedAt' => $published !== '' ? strtotime($published) : null,
            // i.ytimg.com serves these without contacting the visitor's
            // YouTube session, unlike an embedded player.
            'thumbnail' => 'https://i.ytimg.com/vi/' . $id . '/hqdefault.jpg',
            'thumbnailHd' => 'https://i.ytimg.com/vi/' . $id . '/maxresdefault.jpg',
        ];
    }

    return $videos;
}

/**
 * Is this specific video on air at this moment?
 *
 * isLiveNow is false once a broadcast ends, while isLiveContent stays true
 * forever - so only the former answers the question being asked.
 */
function is_live_now(string $videoId): bool
{
    $html = http_get('https://www.youtube.com/watch?v=' . urlencode($videoId), 15);
    if ($html === null) {
        return false;
    }

    return strpos($html, '"isLiveNow":true') !== false;
}

function build_payload(): array
{
    $videos = fetch_videos(CHANNEL_ID);

    $live = null;
    $checked = 0;
    $now = time();

    foreach ($videos as $video) {
        if ($checked >= MAX_LIVE_CHECKS) {
            break;
        }
        // A broadcast in progress is always among the newest entries, so
        // older videos are not worth a 1MB page fetch each.
        if ($checked > 0 && ($video['publishedAt'] === null || $now - $video['publishedAt'] > LIVE_CANDIDATE_AGE)) {
            break;
        }

        $checked++;
        if (is_live_now($video['id'])) {
            $live = [
                'id' => $video['id'],
                'title' => $video['title'],
                'thumbnail' => $video['thumbnail'],
            ];
            break;
        }
    }

    return [
        'channelId' => CHANNEL_ID,
        'live' => $live,
        'videos' => $videos,
        'checkedAt' => gmdate('c'),
    ];
}

// ---------------------------------------------------------------------------

$cacheFile = cache_path();
$fresh = is_readable($cacheFile) && (time() - (int) filemtime($cacheFile)) < CACHE_TTL;

if ($fresh) {
    $cached = file_get_contents($cacheFile);
    if ($cached !== false && $cached !== '') {
        echo $cached;
        exit;
    }
}

$payload = build_payload();

// If YouTube could not be reached, serve the last good answer rather than an
// empty page. A stale list of sermons is far better than none.
if (empty($payload['videos']) && is_readable($cacheFile)) {
    $stale = file_get_contents($cacheFile);
    if ($stale !== false && $stale !== '') {
        header('X-Welm-Cache: stale');
        echo $stale;
        exit;
    }
}

$json = json_encode($payload, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);

if (!empty($payload['videos'])) {
    @file_put_contents($cacheFile, $json, LOCK_EX);
}

echo $json;
