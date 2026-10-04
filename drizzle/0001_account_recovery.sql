ALTER TABLE users ADD COLUMN email_verified_at integer;
--> statement-breakpoint
CREATE TABLE auth_tokens (
  token_hash text PRIMARY KEY NOT NULL,
  user_id text NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  kind text NOT NULL CHECK(kind IN ('reset','verify')),
  expires_at integer NOT NULL,
  used_at integer
);
--> statement-breakpoint
CREATE INDEX auth_tokens_user_kind ON auth_tokens(user_id,kind);
