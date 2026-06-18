# Supabase setup

The live log uses a Supabase project (URL + anon key are set at the top of the
`<script>` in `index.html`, with the editor email). This doc covers the one-time
setup for the two pieces it needs: the **`log` table** and the **`stls` storage
bucket** (the bucket is only needed for the *Log an STL file* feature).

## 1. The `log` table

A single table the site reads (open to everyone) and writes to. Columns:

| column       | type        | notes                                  |
|--------------|-------------|----------------------------------------|
| `id`         | identity PK | auto                                   |
| `created_at` | timestamptz | default `now()`                        |
| `t`          | int8        | client timestamp (ms)                  |
| `kind`       | text        | `STL` / `SCAD` / `JSON`                |
| `name`       | text        |                                        |
| `file`       | text        | filename                               |
| `mode`       | text        | `screws` / `pcbs` / `baseplate` / `other` |
| `size`       | text        |                                        |
| `capacity`   | text        |                                        |
| `snap`       | jsonb       | settings to regenerate, or `{__upload,url,path}` for uploaded files |

RLS: allow `select` and `insert` to everyone (anon); restrict `update` and
`delete` to authenticated users (that's what the key-icon login is for).

## 2. The `stls` storage bucket (for *Log an STL file*)

The upload feature stores the raw `.stl` bytes in Supabase Storage and keeps a
public link in the log row's `snap`. Set it up once:

1. **Storage → New bucket**
   - Name: `stls` (must match `STL_BUCKET` in `index.html`)
   - **Public bucket: ON** — so the `↓ stl` button can fetch files back without auth.

2. **Policies** (Storage → Policies → `stls`). Public read is automatic for a
   public bucket. Add an **INSERT** policy so the site can upload. To match the
   log table (anyone can log), allow anon inserts:

   ```sql
   -- allow anyone to upload into the stls bucket
   create policy "anon upload stls"
     on storage.objects for insert
     to anon, authenticated
     with check (bucket_id = 'stls');
   ```

   To also let signed-in editors clean up files when they delete a log row:

   ```sql
   create policy "auth delete stls"
     on storage.objects for delete
     to authenticated
     using (bucket_id = 'stls');
   ```

   > Want uploads locked down to editors only? Change the insert policy's role
   > from `anon, authenticated` to just `authenticated`. Users will then need to
   > sign in (key icon) before *Save to log* works.

That's it — reload the site, open **Log → Log an STL file**, pick a `.stl`, name
it, and **Save to log**. It lands under the **other files** filter.

## Notes
- Files are capped only by your Supabase plan's storage/size limits. Typical
  gridfinity STLs are 150 KB–1 MB.
- Uploaded entries have no settings to regenerate, so they show a purple **FILE**
  badge and a `↓ stl` button (no **Load**).
- Leaving the Supabase URL/key blank in `index.html` falls back to a local-only
  log; uploads are disabled in that mode (there's nowhere to store the bytes).
