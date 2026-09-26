$file = "c:\Users\Nawakara\.gemini\antigravity-ide\scratch\mc-connect\public\js\admin-core.js"
$content = Get-Content -Raw $file

$content = $content -replace "await apiGet\('/cms/biodata', 'mc_biodata_config'\)", "localStorage.getItem('mc_biodata_config')"
$content = $content -replace "await apiPost\('/cms/biodata', (.*?), 'mc_biodata_config', (.*?)\)", "localStorage.setItem('mc_biodata_config', JSON.stringify(`$1))"

$content = $content -replace "await apiGet\('/cms/packages', 'mc_packages_config'\)", "localStorage.getItem('mc_packages_config')"
$content = $content -replace "await apiPost\('/cms/packages', \{ packages: (.*?) \}, 'mc_packages_config', (.*?)\)", "localStorage.setItem('mc_packages_config', JSON.stringify(`$1))"

$content = $content -replace "await apiGet\('/cms/gallery', 'mc_gallery_config'\)", "localStorage.getItem('mc_gallery_config')"
$content = $content -replace "// gallery saves directly on upload, cache updated via apiGet;", "localStorage.setItem('mc_gallery_config', JSON.stringify(items));"

$content = $content -replace "await apiGet\('/cms/policies', 'mc_policies_config'\)", "localStorage.getItem('mc_policies_config')"
$content = $content -replace "await apiPost\('/cms/policies', (.*?), 'mc_policies_config', (.*?)\)", "localStorage.setItem('mc_policies_config', JSON.stringify(`$1))"

$content = $content -replace "await apiGet\('/cms/presskit', 'mc_presskit_config'\)", "localStorage.getItem('mc_presskit_config')"
$content = $content -replace "await apiPost\('/cms/presskit', (.*?), 'mc_presskit_config', (.*?)\)", "localStorage.setItem('mc_presskit_config', JSON.stringify(`$1))"

$content = $content -replace "await apiGet\('/cms/presskit', PK_KEY\)", "localStorage.getItem(PK_KEY)"
$content = $content -replace "await apiPost\('/cms/presskit', (.*?), PK_KEY, (.*?)\)", "localStorage.setItem(PK_KEY, JSON.stringify(`$1))"

$content = $content -replace "await apiGet\('/cms/riders', 'appRidersData'\)", "localStorage.getItem('appRidersData')"
$content = $content -replace "// saved per item via modal", "localStorage.setItem('appRidersData', JSON.stringify(data));"

$content = $content -replace "await apiGet\('/cms/wardrobe-catalog', 'mc_wardrobe_catalog'\)", "localStorage.getItem('mc_wardrobe_catalog')"
$content = $content -replace "// saved per item via API", "localStorage.setItem('mc_wardrobe_catalog', JSON.stringify(list));"

$content = $content -replace "await apiGet\('/cms/cashflow-categories', 'mc_cashflow_categories'\)", "localStorage.getItem('mc_cashflow_categories')"
$content = $content -replace "await apiPost\('/cms/cashflow-categories', \{ categories: (.*?) \}, 'mc_cashflow_categories', (.*?)\)", "localStorage.setItem('mc_cashflow_categories', JSON.stringify(`$1))"

$content = $content -replace "await apiGet\('/cms/customers', 'mc_customers_db_v1'\)", "localStorage.getItem('mc_customers_db_v1')"
$content = $content -replace "/\* saved per item via API \*/", "localStorage.setItem('mc_customers_db_v1', JSON.stringify(custs));"

$content = $content -replace "await apiGet\('/cms/events', 'mc_events_db_v1'\)", "localStorage.getItem('mc_events_db_v1')"
$content = $content -replace "/\* read-only from API \*/", "localStorage.setItem('mc_events_db_v1', JSON.stringify(adminEventsDb));"

Set-Content -Path $file -Value $content
