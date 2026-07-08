// Fetches public reviews for the business from the Google Places API
// ("Place Details" endpoint) and caches them in memory for 24 hours so we
// don't burn API quota on every homepage visit.
//
// NOTE: Google's Places API returns a maximum of 5 reviews per place, sorted
// by relevance, and does not support pagination. This is a well-known
// limitation of the API itself, not this implementation. For the full list
// of reviews, we always also show a "See all reviews on Google" button that
// links straight to GOOGLE_BUSINESS_PROFILE_URL.

let cache = { data: null, fetchedAt: 0 };
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours

const getGoogleReviews = async (req, res, next) => {
  try {
    const { GOOGLE_PLACES_API_KEY, GOOGLE_PLACE_ID, GOOGLE_BUSINESS_PROFILE_URL } = process.env;

    if (!GOOGLE_PLACES_API_KEY || !GOOGLE_PLACE_ID) {
      return res.json({
        success: true,
        configured: false,
        message: 'Google Places API not configured yet. Set GOOGLE_PLACES_API_KEY and GOOGLE_PLACE_ID in .env',
        profileUrl: GOOGLE_BUSINESS_PROFILE_URL || null,
        reviews: [],
      });
    }

    const now = Date.now();
    if (cache.data && now - cache.fetchedAt < CACHE_TTL) {
      return res.json({ success: true, configured: true, cached: true, ...cache.data });
    }

    const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${GOOGLE_PLACE_ID}&fields=name,rating,user_ratings_total,reviews,url&key=${GOOGLE_PLACES_API_KEY}`;
    const response = await fetch(url);
    const data = await response.json();

    if (data.status !== 'OK') {
      return res.json({
        success: true,
        configured: true,
        message: `Google Places API returned status: ${data.status}`,
        profileUrl: GOOGLE_BUSINESS_PROFILE_URL || null,
        reviews: [],
      });
    }

    const result = {
      businessName: data.result.name,
      rating: data.result.rating,
      totalRatings: data.result.user_ratings_total,
      profileUrl: GOOGLE_BUSINESS_PROFILE_URL || data.result.url,
      reviews: (data.result.reviews || []).map((r) => ({
        author: r.author_name,
        photo: r.profile_photo_url,
        rating: r.rating,
        text: r.text,
        relativeTime: r.relative_time_description,
        time: r.time,
      })),
    };

    cache = { data: result, fetchedAt: now };
    res.json({ success: true, configured: true, cached: false, ...result });
  } catch (err) {
    next(err);
  }
};

module.exports = { getGoogleReviews };
