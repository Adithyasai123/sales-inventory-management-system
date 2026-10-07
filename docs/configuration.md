# Configuration Reference

The backend loads settings from process environment variables and a `.env` file. Start from the root `.env.example`. In Docker Compose, service-to-service addresses use Compose service names (for example, `mysql` and `mailpit`); when running a process directly on the host, use host-reachable addresses such as `localhost`.

| Variable | Purpose | Example/default |
| --- | --- | --- |
| `ENVIRONMENT` | Runtime environment label | `development` |
| `DATABASE_URL` | SQLAlchemy database connection URL | `mysql+pymysql://sims_user:sims_password@localhost:3306/sims_db` |
| `JWT_SECRET_KEY` | Signs access tokens | Set a unique, unpredictable secret for each deployment |
| `JWT_REFRESH_SECRET_KEY` | Signs refresh tokens | Set a separate unique, unpredictable secret |
| `ALGORITHM` | JWT signing algorithm | `HS256` |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | Access token lifetime | `15` |
| `REFRESH_TOKEN_EXPIRE_DAYS` | Refresh token lifetime | `7` |
| `BACKEND_CORS_ORIGINS` | Allowed frontend origins; comma-separated or JSON list | Localhost ports in `.env.example` |
| `SMTP_HOST`, `SMTP_PORT` | SMTP server address | `localhost`, `1025` on host; `mailpit`, `1025` in Compose |
| `SMTP_USER`, `SMTP_PASSWORD` | Optional SMTP credentials | Empty for local Mailpit |
| `SMTP_TLS`, `SMTP_SSL` | SMTP transport security options | `false` for local Mailpit |
| `EMAILS_FROM_EMAIL`, `EMAILS_FROM_NAME` | Sender identity | `noreply@sims.local`, `SIMS Notifications` |
| `DEFAULT_APPROVAL_THRESHOLD` | Initial order approval threshold | `75000.00` |
| `CURRENCY_CODE`, `CURRENCY_LOCALE` | Currency presentation settings | `INR`, `en-IN` |
| `VITE_API_URL` | Optional frontend API base override | Empty for default/proxy configuration |

## Security and deployment notes

- The committed `.env.example` and Compose file are for development. Replace sample JWT secrets, database passwords, and SMTP settings before deployment.
- Keep credentials out of source control. Supply production configuration through the deployment platform's secret/environment settings.
- `BACKEND_CORS_ORIGINS` must include the actual browser origin used to access the frontend.
- Docker Compose exposes database and SMTP ports for local access. Review port exposure and persistent-volume backup needs for any non-local deployment.
- The API setting for the approval threshold may be changed after startup; the environment variable provides the initial/default value.

For commands that consume these settings, see [development](development.md); for threshold behavior, see [workflows](workflows.md).
