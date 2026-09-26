$file = "c:\Users\Nawakara\.gemini\antigravity-ide\scratch\mc-connect\public\js\admin-core.js"
$content = Get-Content -Raw $file

# 1. mc_biodata_config
$content = $content -replace "localStorage\.getItem\('mc_biodata_config'\)", "await apiGet('/cms/biodata', 'mc_biodata_config')"
$content = $content -replace "localStorage\.setItem\('mc_biodata_config', JSON\.stringify\((.*?)\)\)", "await apiPost('/cms/biodata', `$1, 'mc_biodata_config', `$1)"

# 2. mc_packages_config
$content = $content -replace "localStorage\.getItem\('mc_packages_config'\)", "await apiGet('/cms/packages', 'mc_packages_config')"
$content = $content -replace "localStorage\.setItem\('mc_packages_config', JSON\.stringify\((.*?)\)\)", "await apiPost('/cms/packages', { packages: `$1 }, 'mc_packages_config', `$1)"

# 3. mc_gallery_config
$content = $content -replace "localStorage\.getItem\('mc_gallery_config'\)", "await apiGet('/cms/gallery', 'mc_gallery_config')"
$content = $content -replace "localStorage\.setItem\('mc_gallery_config', JSON\.stringify\((.*?)\)\)", "// gallery saves directly on upload, cache updated via apiGet"
$content = $content -replace "localStorage\.removeItem\('mc_gallery_config'\)", ""

# 4. mc_policies_config
$content = $content -replace "localStorage\.getItem\('mc_policies_config'\)", "await apiGet('/cms/policies', 'mc_policies_config')"
$content = $content -replace "localStorage\.setItem\('mc_policies_config', JSON\.stringify\((.*?)\)\)", "await apiPost('/cms/policies', `$1, 'mc_policies_config', `$1)"

# 5. mc_presskit_v2 and mc_presskit_config
$content = $content -replace "localStorage\.getItem\('mc_presskit_config'\)", "await apiGet('/cms/presskit', 'mc_presskit_config')"
$content = $content -replace "localStorage\.setItem\('mc_presskit_config', JSON\.stringify\((.*?)\)\)", "await apiPost('/cms/presskit', `$1, 'mc_presskit_config', `$1)"
$content = $content -replace "localStorage\.getItem\(PK_KEY\)", "await apiGet('/cms/presskit', PK_KEY)"
$content = $content -replace "localStorage\.setItem\(PK_KEY, JSON\.stringify\((.*?)\)\)", "await apiPost('/cms/presskit', `$1, PK_KEY, `$1)"

# 6. appRidersData
$content = $content -replace "localStorage\.getItem\('appRidersData'\)", "await apiGet('/cms/riders', 'appRidersData')"
$content = $content -replace "localStorage\.setItem\('appRidersData', JSON\.stringify\((.*?)\)\)", "// saved per item via modal"

# 7. mc_wardrobe_catalog
$content = $content -replace "localStorage\.getItem\('mc_wardrobe_catalog'\)", "await apiGet('/cms/wardrobe-catalog', 'mc_wardrobe_catalog')"
$content = $content -replace "localStorage\.setItem\('mc_wardrobe_catalog', JSON\.stringify\((.*?)\)\)", "// saved per item via API"

# 8. mc_cashflow_categories
$content = $content -replace "localStorage\.getItem\('mc_cashflow_categories'\)", "await apiGet('/cms/cashflow-categories', 'mc_cashflow_categories')"
$content = $content -replace "localStorage\.setItem\('mc_cashflow_categories', JSON\.stringify\((.*?)\)\)", "await apiPost('/cms/cashflow-categories', { categories: `$1 }, 'mc_cashflow_categories', `$1)"

# 9. mc_customers_db_v1
$content = $content -replace "localStorage\.getItem\('mc_customers_db_v1'\)", "await apiGet('/cms/customers', 'mc_customers_db_v1')"
$content = $content -replace "localStorage\.setItem\('mc_customers_db_v1', JSON\.stringify\((.*?)\)\)", "/* saved per item via API */"

# 10. mc_events_db_v1
$content = $content -replace "localStorage\.getItem\('mc_events_db_v1'\)", "await apiGet('/cms/events', 'mc_events_db_v1')"
$content = $content -replace "localStorage\.setItem\('mc_events_db_v1', JSON\.stringify\((.*?)\)\)", "/* read-only from API */"

Set-Content -Path $file -Value $content
