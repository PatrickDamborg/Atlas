# Forge Atlas -- Azure Setup Guide

This guide walks you through setting up the full Forge Atlas environment in Azure from scratch. Every step uses the Azure Portal (the web interface) unless otherwise noted. No prior Azure experience is required.

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Step 1: Create a Resource Group](#step-1-create-a-resource-group)
3. [Step 2: Create Azure SQL Database](#step-2-create-azure-sql-database)
4. [Step 3: Create Azure Blob Storage](#step-3-create-azure-blob-storage)
5. [Step 4: Create Azure App Service (Backend)](#step-4-create-azure-app-service-backend)
6. [Step 5: Create Azure Static Web Apps (Frontend)](#step-5-create-azure-static-web-apps-frontend)
7. [Step 6: Configure Azure Entra ID (App Registration)](#step-6-configure-azure-entra-id-app-registration)
8. [Step 7: Connect Everything](#step-7-connect-everything)
9. [Step 8: Run the Database Schema](#step-8-run-the-database-schema)
10. [Cost Estimation](#cost-estimation)
11. [Scaling Up (When Needed)](#scaling-up-when-needed)
12. [Troubleshooting](#troubleshooting)

---

## Prerequisites

Before you begin, make sure you have:

- **Azure subscription** with your $5,000 credits active. Log in at [portal.azure.com](https://portal.azure.com) and confirm you can see your subscription.
- **GitHub account** with the Atlas repository pushed to it (the deployment pipelines pull from GitHub).
- **The Atlas repo on GitHub** -- the repository should contain the `frontend/` folder (Next.js app) and the backend Python code at the root level.
- **A modern web browser** -- Edge or Chrome recommended for the Azure Portal.

> **Tip:** Keep a text file or spreadsheet open as you go. You will collect several values (connection strings, client IDs, URLs) that you will need later.

---

## Step 1: Create a Resource Group

A **Resource Group** is simply a folder in Azure. It keeps all the services for Forge Atlas together so you can manage, monitor, and delete them in one place.

### Portal Steps

1. Go to [portal.azure.com](https://portal.azure.com).
2. In the top search bar, type **Resource groups** and click the result.
3. Click **+ Create**.
4. Fill in the form:
   - **Subscription:** Select your active subscription (the one with $5,000 credits).
   - **Resource group name:** `rg-forge-atlas`
   - **Region:** Choose the region closest to your users:
     - **West Europe** (Netherlands) or **North Europe** (Ireland) -- recommended for EU data residency.
     - **East US** (Virginia) -- recommended for US-based users.
5. Click **Review + create**, then **Create**.

> **Important:** Use the same region for ALL resources you create in this guide. Keeping everything in one region reduces latency and avoids cross-region data transfer costs.

### What to note down

| Item | Value |
|------|-------|
| Resource group name | `rg-forge-atlas` |
| Region | *(your chosen region)* |

---

## Step 2: Create Azure SQL Database

Azure SQL Database is the managed relational database that stores all Forge Atlas data -- projects, users, walkthrough content, consent records, progress tracking, and audit logs.

We use the **Serverless** compute tier, which automatically pauses when nobody is using the app and scales up when traffic returns. This is ideal for a project that may have bursts of activity followed by quiet periods.

### 2a: Create the SQL Server

1. In the Azure Portal search bar, type **SQL databases** and click the result.
2. Click **+ Create**.
3. Under **Server**, click **Create new**.
4. Fill in the server details:
   - **Server name:** `sql-forge-atlas` (this becomes `sql-forge-atlas.database.windows.net`)
   - **Location:** Same region as your resource group.
   - **Authentication method:** Select **Use SQL authentication**.
   - **Server admin login:** Choose a username (e.g., `atlasadmin`). Write it down.
   - **Password:** Choose a strong password (min. 8 characters, with uppercase, lowercase, numbers, and symbols). **Write it down securely -- you will not be able to retrieve it later.**
5. Click **OK** to confirm the server.

### 2b: Configure the Database

Continue on the same "Create SQL Database" page:

6. **Subscription:** Your active subscription.
7. **Resource group:** Select `rg-forge-atlas`.
8. **Database name:** `forge-atlas-db`
9. **Want to use SQL elastic pool?** Select **No**.
10. **Compute + storage:** Click **Configure database**.
    - **Service tier:** Select **General Purpose (Serverless)**.
    - **Hardware:** Standard-series (Gen5) is fine.
    - **Max vCores:** `1`
    - **Min vCores:** `0.5` (allows the database to scale down)
    - **Max memory:** `1 GB` (this is auto-calculated based on vCores)
    - **Auto-pause delay:** `60 minutes` (the database pauses after 1 hour of inactivity -- saves money)
    - **Data max size:** `32 GB` (more than enough to start)
    - Click **Apply**.
11. **Backup storage redundancy:** Select **Locally-redundant backup storage** (cheapest option, fine for a non-critical workload).

### 2c: Configure Networking

12. Click the **Networking** tab at the top.
13. **Connectivity method:** Select **Public endpoint**.
14. Under **Firewall rules:**
    - **Allow Azure services and resources to access this server:** Toggle to **Yes**. (This lets your App Service connect to the database.)
    - **Add current client IP address:** Toggle to **Yes**. (This lets you connect from your computer for testing and running the schema.)
15. Click **Review + create**, then **Create**.
16. Wait for deployment to complete (1-3 minutes).

### 2d: Get the Connection String

17. Once deployed, go to your new database: Search **SQL databases** and click `forge-atlas-db`.
18. In the left menu, click **Connection strings**.
19. Copy the **ADO.NET** connection string. It will look like this:

```
Driver={ODBC Driver 18 for SQL Server};Server=tcp:sql-forge-atlas.database.windows.net,1433;Database=forge-atlas-db;Uid=atlasadmin;Pwd={your_password};Encrypt=yes;TrustServerCertificate=no;Connection Timeout=30;
```

20. Replace `{your_password}` with the actual password you set in step 2a.

### What to note down

| Item | Value |
|------|-------|
| Server name | `sql-forge-atlas.database.windows.net` |
| Database name | `forge-atlas-db` |
| Admin username | *(your username)* |
| Admin password | *(your password -- store securely)* |
| Full connection string | *(see above, with password filled in)* |

> **Money-saving note:** The Serverless tier means you are only charged for compute when the database is active. After 60 minutes of no queries, it automatically pauses. The first query after a pause takes ~10 seconds to "wake up" -- this is normal.

---

## Step 3: Create Azure Blob Storage

Blob Storage holds uploaded Dataverse solution ZIP files and project logo images. Think of it as a cloud file system.

### 3a: Create the Storage Account

1. In the Azure Portal search bar, type **Storage accounts** and click the result.
2. Click **+ Create**.
3. Fill in the form:
   - **Subscription:** Your active subscription.
   - **Resource group:** `rg-forge-atlas`
   - **Storage account name:** `stforgeatlasfiles` (must be globally unique, lowercase, no hyphens, 3-24 characters). If this name is taken, try `stforgeatlas01` or similar.
   - **Region:** Same region as everything else.
   - **Performance:** **Standard** (not Premium).
   - **Redundancy:** **Locally-redundant storage (LRS)** -- cheapest option, fine for solution files and logos.
4. Click **Review + create**, then **Create**.
5. Wait for deployment to complete.

### 3b: Create the Containers

Containers are like top-level folders inside your storage account.

6. Go to your new storage account (click **Go to resource** after deployment).
7. In the left menu, under **Data storage**, click **Containers**.
8. Click **+ Container**.
   - **Name:** `solution-uploads`
   - **Public access level:** **Private (no anonymous access)**
   - Click **Create**.
9. Click **+ Container** again.
   - **Name:** `logos`
   - **Public access level:** **Private (no anonymous access)**
   - Click **Create**.

> **Why Private?** The backend API controls access to these files. End users never download directly from Blob Storage -- the backend fetches files and serves them through authenticated endpoints.

### 3c: Get the Connection String

10. In the left menu of your storage account, under **Security + networking**, click **Access keys**.
11. Click **Show** next to key1's Connection string.
12. Click the copy button to copy the full connection string. It will look like:

```
DefaultEndpointsProtocol=https;AccountName=stforgeatlasfiles;AccountKey=abc123...==;EndpointSuffix=core.windows.net
```

### What to note down

| Item | Value |
|------|-------|
| Storage account name | `stforgeatlasfiles` |
| Blob connection string | *(copied from Access keys)* |
| Container names | `solution-uploads`, `logos` |

---

## Step 4: Create Azure App Service (Backend)

The App Service hosts the Forge Atlas Python/FastAPI backend. It handles API requests, processes solution uploads, runs the AI pipeline, and communicates with the database and blob storage.

### 4a: Create the App Service Plan

The App Service Plan is the "server" that runs your app. The **B1 (Basic)** tier is a good starting point -- it is always on, has 1.75 GB RAM, and costs around $13/month.

1. In the Azure Portal search bar, type **App Services** and click the result.
2. Click **+ Create** and select **Web App**.
3. Fill in the **Basics** tab:
   - **Subscription:** Your active subscription.
   - **Resource group:** `rg-forge-atlas`
   - **Name:** `forge-atlas-api` (this becomes `forge-atlas-api.azurewebsites.net`)
   - **Publish:** **Code**
   - **Runtime stack:** **Python 3.11**
   - **Operating System:** **Linux**
   - **Region:** Same region as everything else.
   - **App Service Plan:** Click **Create new**.
     - **Name:** `asp-forge-atlas`
     - **Pricing plan:** Select **Basic B1** ($13.14/month)
   - Click **OK**.
4. Click **Review + create**, then **Create**.
5. Wait for deployment to complete.

### 4b: Configure Application Settings (Environment Variables)

These settings tell the backend how to connect to the database, blob storage, and Azure Entra ID.

6. Go to your new App Service (click **Go to resource**).
7. In the left menu, under **Settings**, click **Environment variables** (or **Configuration** in older Portal versions).
8. Click **+ Add** for each of the following settings. Add them one by one:

| Name | Value | Description |
|------|-------|-------------|
| `DATABASE_URL` | *(your SQL connection string from Step 2d)* | Connects to Azure SQL |
| `AZURE_STORAGE_CONNECTION_STRING` | *(your blob connection string from Step 3c)* | Connects to Blob Storage |
| `AZURE_STORAGE_CONTAINER_SOLUTIONS` | `solution-uploads` | Container for ZIP files |
| `AZURE_STORAGE_CONTAINER_LOGOS` | `logos` | Container for logo images |
| `AZURE_CLIENT_ID` | *(from Step 6 -- add later)* | Entra ID app client ID |
| `AZURE_TENANT_ID` | *(from Step 6 -- add later)* | Entra ID tenant ID |
| `CORS_ORIGINS` | *(your Static Web App URL -- add after Step 5)* | Allowed frontend origins |
| `ENVIRONMENT` | `production` | Tells the app to use production settings |

> **Note:** You will come back to fill in `AZURE_CLIENT_ID`, `AZURE_TENANT_ID`, and `CORS_ORIGINS` after completing Steps 5 and 6. Just add the ones you have now.

9. Click **Save** at the top. Confirm when prompted (this restarts the app).

### 4c: Set the Startup Command

10. In the left menu, under **Settings**, click **Configuration** (or **General settings** tab).
11. Find the **Startup Command** field and enter:

```
gunicorn -w 4 -k uvicorn.workers.UvicornWorker app.main:app --bind 0.0.0.0:8000
```

This tells Azure to start the FastAPI backend using Gunicorn with 4 worker processes.

12. Click **Save**.

### 4d: Enable Application Logging

13. In the left menu, under **Monitoring**, click **App Service logs**.
14. Set **Application logging (Filesystem):** **On**.
15. **Level:** **Information** (or **Verbose** if you are debugging).
16. **Retention Period (Days):** `7`
17. Click **Save**.

> **Tip:** To view logs, go to **Log stream** in the left menu. This shows live output from the backend, which is invaluable for debugging.

### 4e: Configure CORS

You will complete this after creating the Static Web App in Step 5.

18. In the left menu, under **API**, click **CORS**.
19. In the **Allowed Origins** box, add your Static Web App URL (e.g., `https://forge-atlas-web.azurestaticapps.net`).
20. Also add `http://localhost:3000` if you want to test locally against the deployed backend.
21. Click **Save**.

### What to note down

| Item | Value |
|------|-------|
| App Service URL | `https://forge-atlas-api.azurewebsites.net` |
| App Service name | `forge-atlas-api` |

---

## Step 5: Create Azure Static Web Apps (Frontend)

Azure Static Web Apps hosts the Next.js frontend. It connects directly to your GitHub repo and automatically deploys when you push changes to the main branch.

### 5a: Create the Static Web App

1. In the Azure Portal search bar, type **Static Web Apps** and click the result.
2. Click **+ Create**.
3. Fill in the form:
   - **Subscription:** Your active subscription.
   - **Resource group:** `rg-forge-atlas`
   - **Name:** `forge-atlas-web`
   - **Plan type:** **Standard** ($9/month -- supports custom domains, staging environments, and authentication).
   - **Region:** Select a region. Note: Static Web Apps regions are different from other Azure services. Pick the one closest to your users (e.g., **West Europe** or **East US 2**).
   - **Source:** **GitHub**
   - Click **Sign in with GitHub** and authorize Azure to access your repos.
   - **Organization:** Your GitHub username or org.
   - **Repository:** Select the Atlas repo.
   - **Branch:** `main` (or whichever branch you deploy from).
4. Under **Build Details:**
   - **Build Presets:** Select **Custom**.
   - **App location:** `frontend` (this is where the Next.js app lives in the repo).
   - **API location:** Leave blank (the backend is a separate App Service).
   - **Output location:** `.next`
5. Click **Review + create**, then **Create**.
6. Wait for deployment. Azure will create a GitHub Actions workflow file in your repo and trigger the first build.

> **Note:** The first deployment takes 3-5 minutes. You can monitor progress in the **Actions** tab of your GitHub repo.

### 5b: Add Environment Variables

7. Once deployed, go to your Static Web App (click **Go to resource**).
8. In the left menu, click **Environment variables** (or **Configuration**).
9. Add the following variables:

| Name | Value | Description |
|------|-------|-------------|
| `NEXT_PUBLIC_AZURE_CLIENT_ID` | *(from Step 6 -- add later)* | Entra ID app client ID |
| `NEXT_PUBLIC_AZURE_TENANT_ID` | *(from Step 6 -- add later)* | Entra ID directory/tenant ID |
| `NEXT_PUBLIC_AZURE_REDIRECT_URI` | `https://forge-atlas-web.azurestaticapps.net` | Where Entra ID sends users after login |
| `NEXT_PUBLIC_AZURE_POST_LOGOUT_URI` | `https://forge-atlas-web.azurestaticapps.net` | Where users land after logout |
| `NEXT_PUBLIC_AZURE_API_SCOPE` | `api://<client-id>/access` | Custom API scope (fill in after Step 6) |

> **Note:** You will finalize these values after completing Step 6. For now, just note the Static Web App URL.

10. Click **Save**.

### 5c: Note the Static Web App URL

11. On the **Overview** page, find the **URL** field. It will be something like:
    `https://forge-atlas-web.azurestaticapps.net`

12. **Go back to Step 4e** and add this URL to the App Service CORS settings.
13. **Go back to Step 4b** and set the `CORS_ORIGINS` environment variable to this URL.

### What to note down

| Item | Value |
|------|-------|
| Static Web App URL | `https://forge-atlas-web.azurestaticapps.net` |
| Static Web App name | `forge-atlas-web` |

---

## Step 6: Configure Azure Entra ID (App Registration)

Azure Entra ID (formerly Azure Active Directory) handles authentication. Forge Atlas uses MSAL (Microsoft Authentication Library) to sign in consultants with their Microsoft work accounts. The app registration is likely already partially configured; this section ensures everything is set correctly.

### 6a: Create or Locate the App Registration

1. In the Azure Portal search bar, type **App registrations** and click the result (under Microsoft Entra ID).
2. Check the **All applications** tab to see if a Forge Atlas registration already exists.
   - **If it exists:** Click on it and proceed to step 6b.
   - **If it does not exist:** Click **+ New registration** and fill in:
     - **Name:** `Forge Atlas`
     - **Supported account types:** **Accounts in this organizational directory only** (single tenant) -- unless you need multi-tenant access.
     - **Redirect URI:** Select **Single-page application (SPA)** and enter your Static Web App URL followed by the root path: `https://forge-atlas-web.azurestaticapps.net`
     - Click **Register**.

### 6b: Configure Redirect URIs

3. In the app registration, go to **Authentication** in the left menu.
4. Under **Single-page application** redirect URIs, make sure these are listed:
   - `https://forge-atlas-web.azurestaticapps.net` (production)
   - `http://localhost:3000` (local development)
5. If any are missing, click **Add URI** and add them.
6. Under **Implicit grant and hybrid flows**, make sure both are **unchecked** (MSAL v2 uses the authorization code flow with PKCE, not implicit grant).
7. Click **Save**.

### 6c: Configure API Permissions

8. In the left menu, click **API permissions**.
9. You should see **Microsoft Graph > User.Read** (delegated) already listed. If not:
   - Click **+ Add a permission**.
   - Select **Microsoft Graph**.
   - Select **Delegated permissions**.
   - Search for and check: **User.Read**, **openid**, **profile**, **email**.
   - Click **Add permissions**.
10. If you see a warning about admin consent, click **Grant admin consent for [your org]** (requires admin rights).

### 6d: Expose an API (Custom Scope for Backend)

This creates a custom scope so the frontend can request tokens specifically for your backend API.

11. In the left menu, click **Expose an API**.
12. If **Application ID URI** is not set, click **Set** and accept the default (`api://<client-id>`) or enter a custom one. Click **Save**.
13. Click **+ Add a scope**.
    - **Scope name:** `access`
    - **Who can consent?** **Admins and users**
    - **Admin consent display name:** `Access Forge Atlas API`
    - **Admin consent description:** `Allows the app to access the Forge Atlas API on behalf of the signed-in user.`
    - **User consent display name:** `Access Forge Atlas API`
    - **User consent description:** `Allows the app to access the Forge Atlas API on your behalf.`
    - **State:** **Enabled**
    - Click **Add scope**.

The full scope string will be: `api://<client-id>/access`

### 6e: Note Down the IDs

14. Go to the **Overview** page of the app registration.
15. Copy these values:

| Item | Value |
|------|-------|
| Application (client) ID | *(a GUID like `12345678-abcd-...`)* |
| Directory (tenant) ID | *(a GUID like `87654321-dcba-...`)* |
| API Scope | `api://<client-id>/access` |

### 6f: Update All Configuration

Now go back and fill in the values you left blank earlier:

**App Service (Step 4b) -- environment variables:**
- `AZURE_CLIENT_ID` = your Application (client) ID
- `AZURE_TENANT_ID` = your Directory (tenant) ID

**Static Web App (Step 5b) -- environment variables:**
- `NEXT_PUBLIC_AZURE_CLIENT_ID` = your Application (client) ID
- `NEXT_PUBLIC_AZURE_TENANT_ID` = your Directory (tenant) ID
- `NEXT_PUBLIC_AZURE_API_SCOPE` = `api://<client-id>/access`
- `NEXT_PUBLIC_AZURE_REDIRECT_URI` = your Static Web App URL

> **Important:** After updating Static Web App environment variables, you may need to re-deploy (trigger a new GitHub Actions run) for the changes to take effect, since `NEXT_PUBLIC_*` variables are baked in at build time. You can trigger a re-deploy by pushing a small commit or re-running the workflow from the GitHub Actions tab.

---

## Step 7: Connect Everything

At this point, all the pieces are created. This step is a checklist to verify everything is wired together correctly.

### 7a: API Routing (Frontend to Backend)

The Next.js frontend uses a rewrite rule to proxy `/api/*` requests to the backend. In local development, this is configured in `frontend/next.config.ts`:

```typescript
async rewrites() {
  return [
    {
      source: "/api/:path*",
      destination: "http://localhost:8000/:path*",
    },
  ];
}
```

**For production on Azure Static Web Apps**, you need a `staticwebapp.config.json` file in the `frontend/` folder to proxy API calls to your App Service. Create or update the file with:

```json
{
  "routes": [
    {
      "route": "/api/*",
      "methods": ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
      "rewrite": "https://forge-atlas-api.azurewebsites.net/api/*"
    }
  ],
  "navigationFallback": {
    "rewrite": "/index.html",
    "exclude": ["/api/*", "/_next/*", "/images/*", "/favicon.ico"]
  }
}
```

> **Note:** Replace `forge-atlas-api.azurewebsites.net` with your actual App Service hostname. Commit this file to your repo and push to trigger a re-deploy.

### 7b: Verification Checklist

| Connection | From | To | How |
|------------|------|----|-----|
| Frontend to Backend | Static Web App | App Service | `staticwebapp.config.json` rewrites `/api/*` |
| Backend to Database | App Service | SQL Database | `DATABASE_URL` env var |
| Backend to Blob Storage | App Service | Storage Account | `AZURE_STORAGE_CONNECTION_STRING` env var |
| Frontend to Entra ID | Static Web App | Entra ID | `NEXT_PUBLIC_AZURE_*` env vars + MSAL config |
| Backend CORS | App Service | Static Web App | CORS allowed origins setting |
| Entra ID Redirects | Entra ID | Static Web App | Redirect URIs in app registration |

### 7c: End-to-End Test

1. Open your Static Web App URL in a browser.
2. You should see the Forge Atlas login page.
3. Click **Sign in** -- it should redirect to Microsoft login.
4. After signing in, you should be redirected back to the Forge Atlas dashboard.
5. Try uploading a solution ZIP file to verify blob storage connectivity.
6. Check the App Service **Log stream** for any errors.

---

## Step 8: Run the Database Schema

The database is currently empty. You need to create the tables by running the schema SQL script.

### Option A: Azure Portal Query Editor (Simplest)

1. In the Azure Portal, go to **SQL databases** and click `forge-atlas-db`.
2. In the left menu, click **Query editor (preview)**.
3. Log in with the SQL admin username and password you created in Step 2a.
   - If you get a firewall error, the Portal will offer to add your IP -- click the link to add it, then retry.
4. Open the file `database/schema.sql` from the Atlas repository on your local machine.
5. Copy the entire contents and paste it into the query editor.
6. Click **Run**.
7. You should see "Query succeeded" messages for each `CREATE TABLE` statement.

### Option B: Azure Data Studio (Better for Large Scripts)

1. Download [Azure Data Studio](https://learn.microsoft.com/en-us/azure-data-studio/download-azure-data-studio) (free, from Microsoft).
2. Click **New Connection**.
3. Fill in:
   - **Server:** `sql-forge-atlas.database.windows.net`
   - **Authentication type:** SQL Login
   - **User name:** Your admin username
   - **Password:** Your admin password
   - **Database:** `forge-atlas-db`
   - **Encrypt:** **Mandatory**
   - **Trust server certificate:** **No**
4. Click **Connect**.
5. Open the `database/schema.sql` file (File > Open File).
6. Click **Run** (or press F5).
7. Verify that all tables are created by running: `SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES;`

### Option C: SQL Server Management Studio (SSMS)

If you already have SSMS installed, the connection steps are similar to Azure Data Studio. Use the same server name, credentials, and make sure to enable encryption.

---

## Cost Estimation

Based on the architecture described above, here is the estimated monthly cost:

| Service | SKU / Tier | Est. Monthly Cost | Notes |
|---------|-----------|-------------------|-------|
| Azure SQL Database | Serverless, General Purpose, 1 vCore | $30 -- $80 | Depends on usage; auto-pauses when idle |
| App Service | B1 Linux | ~$13 | Always on, 1.75 GB RAM, 1 vCPU |
| Static Web Apps | Standard | ~$9 | Includes custom domains, staging slots |
| Blob Storage | Standard Hot LRS | ~$1 | Based on a few GB of ZIPs and logos |
| Azure Entra ID | Free tier (included) | $0 | Included with Azure subscription |
| **Total** | | **~$53 -- $103/month** | |

**With your $5,000 credits**, this setup will run for approximately **48 to 94 months** (4 to 8 years) at these usage levels.

> **Cost optimization tips:**
> - The SQL Serverless auto-pause is the biggest money saver. If the app is only used during business hours, the database could be paused 16+ hours per day.
> - Blob Storage costs are negligible for typical usage (a few hundred solution files and logos).
> - Monitor your spending in **Cost Management + Billing** in the Azure Portal. Set up a monthly budget alert at $100 to avoid surprises.

---

## Scaling Up (When Needed)

As your user base or workload grows, here is where to upgrade:

### Database (Azure SQL)

- **More CPU:** Increase max vCores from 1 to 2 or 4 in the Serverless configuration (higher cost when active, but still pauses when idle).
- **Consistent workload:** Switch from Serverless to **Provisioned** (fixed cost, no wake-up delay). A 2-vCore provisioned General Purpose database costs ~$190/month.

### App Service (Backend)

- **B1 to S1** (~$70/month): Adds auto-scaling, deployment slots, and custom domains with SSL.
- **S1 to P1v3** (~$115/month): Premium hardware, more memory, faster CPU. Recommended if the AI pipeline processing becomes a bottleneck.
- **Scale out:** Add multiple instances (horizontal scaling) under **Scale out (App Service plan)** in the Portal.

### Static Web Apps

- **Standard** is already the recommended tier. It supports:
  - Custom domains with free SSL
  - Staging environments (preview branches)
  - 100 GB bandwidth/month
- If you need global CDN or advanced WAF, consider adding **Azure Front Door** in front of the Static Web App.

### Blob Storage

- Storage costs are very low. If you handle very large files (hundreds of GBs), consider moving to **Cool** tier for infrequently accessed data.

---

## Troubleshooting

### Connection String Issues

**Symptom:** Backend fails to connect to SQL Database on startup.

- Double-check the `DATABASE_URL` environment variable in App Service. Make sure:
  - The password does not contain unescaped special characters. If your password has `{`, `}`, or `;`, you may need to URL-encode it or choose a simpler password.
  - The server name ends in `.database.windows.net`.
  - Port `1433` is specified.
- In the SQL Server's **Networking** settings (not the database, the *server*), confirm "Allow Azure services and resources to access this server" is set to **Yes**.

### CORS Errors

**Symptom:** Browser console shows `Access-Control-Allow-Origin` errors when the frontend calls the API.

- Go to the App Service > **CORS** settings.
- Make sure the Static Web App URL is listed exactly (including `https://` and no trailing slash).
- If you are testing locally, add `http://localhost:3000` to CORS as well.
- After changing CORS settings, hard-refresh the browser (Ctrl+Shift+R).

### MSAL Redirect URI Mismatch

**Symptom:** After clicking "Sign in", you get an error page from Microsoft saying "The redirect URI specified in the request does not match the redirect URIs configured for the application."

- Go to **Entra ID > App registrations > Forge Atlas > Authentication**.
- Verify that the Static Web App URL is listed as a **Single-page application** redirect URI (not Web, not Mobile).
- The URI must match exactly -- check for:
  - Missing or extra trailing slash
  - `http` vs. `https`
  - Typos in the domain name
- After updating redirect URIs, it can take a few minutes to propagate.

### SQL Firewall Rules

**Symptom:** "Cannot connect to server" from your local machine or Azure Data Studio.

- Go to the **SQL server** (not the database) in the Azure Portal.
- Click **Networking** in the left menu.
- Under **Firewall rules**, click **+ Add your client IPv4 address**.
- Click **Save**.
- If your IP changes (e.g., you are on a VPN or home network), you need to add the new IP.

### Static Web App Build Failures

**Symptom:** GitHub Actions workflow fails during build.

- Go to your GitHub repo > **Actions** tab > click the failing run.
- Look at the build logs for error messages.
- Common issues:
  - Missing environment variables (especially `NEXT_PUBLIC_*` vars that are needed at build time).
  - Node.js version mismatch -- ensure the GitHub Actions workflow uses Node 18+.
  - Missing `package-lock.json` in the `frontend/` folder.

### Database Auto-Pause Wake-Up Delay

**Symptom:** First request after a period of inactivity takes 10-30 seconds.

- This is expected with the Serverless tier. The database auto-pauses after 60 minutes of inactivity and takes a few seconds to resume.
- If this is unacceptable for your use case, either:
  - Reduce the auto-pause delay setting (minimum is 60 minutes), or
  - Switch to the Provisioned tier (always on, no wake-up delay).

### Backend Startup Failures

**Symptom:** App Service shows "Application Error" or the Log stream shows import errors.

- Check that the **Startup Command** is set correctly (Step 4c).
- Verify that the runtime is set to **Python 3.11**.
- Check the **Log stream** for specific error messages:
  - `ModuleNotFoundError` -- the deployment may not have installed dependencies. Ensure `requirements.txt` is at the root of the repo.
  - `Connection refused` to the database -- check the `DATABASE_URL` and SQL firewall rules.

---

## Quick Reference: All Environment Variables

### App Service (Backend) Environment Variables

| Variable | Example Value |
|----------|---------------|
| `DATABASE_URL` | `Driver={ODBC Driver 18 for SQL Server};Server=tcp:sql-forge-atlas.database.windows.net,1433;Database=forge-atlas-db;Uid=atlasadmin;Pwd=YourP@ssw0rd;Encrypt=yes;TrustServerCertificate=no;Connection Timeout=30;` |
| `AZURE_STORAGE_CONNECTION_STRING` | `DefaultEndpointsProtocol=https;AccountName=stforgeatlasfiles;AccountKey=...;EndpointSuffix=core.windows.net` |
| `AZURE_STORAGE_CONTAINER_SOLUTIONS` | `solution-uploads` |
| `AZURE_STORAGE_CONTAINER_LOGOS` | `logos` |
| `AZURE_CLIENT_ID` | `12345678-abcd-1234-abcd-123456789012` |
| `AZURE_TENANT_ID` | `87654321-dcba-4321-dcba-210987654321` |
| `CORS_ORIGINS` | `https://forge-atlas-web.azurestaticapps.net` |
| `ENVIRONMENT` | `production` |

### Static Web App (Frontend) Environment Variables

| Variable | Example Value |
|----------|---------------|
| `NEXT_PUBLIC_AZURE_CLIENT_ID` | `12345678-abcd-1234-abcd-123456789012` |
| `NEXT_PUBLIC_AZURE_TENANT_ID` | `87654321-dcba-4321-dcba-210987654321` |
| `NEXT_PUBLIC_AZURE_REDIRECT_URI` | `https://forge-atlas-web.azurestaticapps.net` |
| `NEXT_PUBLIC_AZURE_POST_LOGOUT_URI` | `https://forge-atlas-web.azurestaticapps.net` |
| `NEXT_PUBLIC_AZURE_API_SCOPE` | `api://12345678-abcd-1234-abcd-123456789012/access` |
