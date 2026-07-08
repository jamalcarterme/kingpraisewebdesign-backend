# King Praise Web Design — Backend API

Node.js / Express / MongoDB API powering the agency platform: auth (admin + client),
blog, announcements, team, portfolio projects, testimonials, Google reviews, call
booking, contact form, and client project/milestone tracking.

## 1. Install

```bash
cd backend
npm install
```

## 2. Configure environment

```bash
cp .env.example .env
```

Fill in:
- **MONGO_URI** — MongoDB Atlas connection string.
- **JWT_SECRET / REFRESH_TOKEN_SECRET** — any long random strings.
- **ADMIN_BOOTSTRAP_EMAIL / ADMIN_BOOTSTRAP_PASSWORD** — the first admin account
  is auto-created on server start if no admin exists yet. Log in with these,
  then change the password.
- **CLIENT_URL** — your deployed frontend origin(s), comma separated. Required
  for CORS + cookies to work.
- **CLOUDINARY_*** — from cloudinary.com dashboard (image uploads for team
  photos, project screenshots, blog covers).
- **GOOGLE_PLACES_API_KEY / GOOGLE_PLACE_ID** — optional, powers the live
  Google reviews section on the homepage (see below).
- **SMTP_*** — optional, enables email notifications for new bookings/contact
  messages. Without it, submissions still save to the database, just no email.

## 3. Run

```bash
npm run dev     # nodemon, local development
npm start        # production
```

Deploy the same as your other projects (Render free tier works, same cold-start
handling patterns apply — ping /api/health from the frontend to warm it up).

## 4. Setting up Google Reviews

Google's **Business Profile API** requires OAuth as the verified business owner,
which isn't practical to wire into a public website. Instead this uses the
**Places API "Place Details"** endpoint, which returns up to 5 public reviews
for any place — no owner login needed, just an API key.

1. In Google Cloud Console, enable the **Places API** and generate an API key.
2. Find your Place ID at
   https://developers.google.com/maps/documentation/places/web-service/place-id
   — search "King Praise Web Design".
3. Set `GOOGLE_PLACES_API_KEY` and `GOOGLE_PLACE_ID` in `.env`.
4. The homepage will now show your live Google rating + up to 5 reviews, with
   a "See all reviews on Google" button linking to your full profile
   (https://g.page/r/CbUMkACYKWKXEAE/review) since Google's API itself caps
   at 5 reviews and doesn't paginate further — that's a Google limitation,
   not this code.

Reviews are cached in memory for 24 hours to conserve API quota.

## 5. Key endpoints

| Method | Route | Access |
|---|---|---|
| POST | /api/auth/register | Public — client self sign-up |
| POST | /api/auth/login | Public |
| POST | /api/auth/admin-login | Public (admin accounts only) |
| POST | /api/auth/refresh | Uses httpOnly refresh cookie |
| GET | /api/blog | Public |
| POST/PUT/DELETE | /api/blog | Admin |
| GET | /api/team | Public |
| POST/PUT/DELETE | /api/team | Admin |
| GET | /api/projects | Public |
| POST/PUT/DELETE | /api/projects | Admin |
| GET | /api/testimonials | Public |
| GET | /api/reviews/google | Public (live Google reviews) |
| POST | /api/bookings | Public — schedule a call |
| GET/PUT/DELETE | /api/bookings | Admin |
| POST | /api/contact | Public |
| GET | /api/client-projects/mine | Logged-in client |
| GET/POST | /api/client-projects | Admin |
| POST/PUT/DELETE | /api/client-projects/:id/milestones | Admin |

## Notes

- Auth follows your established pattern: short-lived JWT access token returned
  in the response body (store in memory/localStorage on the frontend), plus a
  long-lived refresh token in an httpOnly cookie.
- File uploads go straight to Cloudinary via multer-storage-cloudinary.
- CORS is locked to `CLIENT_URL` with `credentials: true` for the cookie flow.
