const fs = require('fs');

// 1. Add Route
let routes = fs.readFileSync('routes/api.php', 'utf8');
if (!routes.includes('music-bank/upload')) {
    routes = routes.replace("Route::post('/cms/music-bank', [CmsApiController::class, 'saveMusicBank']);", 
    "Route::post('/cms/music-bank', [CmsApiController::class, 'saveMusicBank']);\nRoute::post('/cms/music-bank/upload', [CmsApiController::class, 'uploadMusicBankFile']);");
    fs.writeFileSync('routes/api.php', routes);
}

// 2. Add Controller Method
let controller = fs.readFileSync('app/Http/Controllers/CmsApiController.php', 'utf8');
if (!controller.includes('function uploadMusicBankFile')) {
    const methodStr = `
    public function uploadMusicBankFile(Request $request)
    {
        if ($request->hasFile('file')) {
            $file = $request->file('file');
            $filename = time() . '_' . $file->getClientOriginalName();
            $file->move(public_path('uploads/music'), $filename);
            return response()->json([
                'success' => true,
                'url' => '/uploads/music/' . $filename
            ]);
        }
        return response()->json(['success' => false, 'message' => 'No file uploaded']);
    }
`;
    // Insert before the last brace
    const lastBraceIdx = controller.lastIndexOf('}');
    controller = controller.substring(0, lastBraceIdx) + methodStr + controller.substring(lastBraceIdx);
    fs.writeFileSync('app/Http/Controllers/CmsApiController.php', controller);
}

console.log("Added upload API.");
