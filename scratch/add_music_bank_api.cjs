const fs = require('fs');
const file = 'app/Http/Controllers/CmsApiController.php';
let code = fs.readFileSync(file, 'utf8');

const newMethods = `
    public function getMusicBank(Request $request)
    {
        $host = $request->getHost();
        if (auth()->check()) {
            $mc = $this->getMC();
        } else {
            $mc = \\App\\Models\\UserMC::where('custom_domain', $host)->first() ?? \\App\\Models\\UserMC::first();
        }

        if (!$mc) {
            return response()->json(['success' => false, 'message' => 'MC not found']);
        }

        $data = $mc->music_bank ? (is_string($mc->music_bank) ? json_decode($mc->music_bank, true) : $mc->music_bank) : [];
        return response()->json(['success' => true, 'data' => $data]);
    }

    public function saveMusicBank(Request $request)
    {
        $mc = $this->getMC();
        if (!$mc) return response()->json(['success' => false, 'message' => 'Not authenticated']);
        
        $mc->music_bank = json_encode($request->input('data', []));
        $mc->save();
        
        return response()->json(['success' => true]);
    }
}
`;

code = code.replace(/}\s*$/, newMethods);
fs.writeFileSync(file, code);
console.log('Added music bank API methods');
