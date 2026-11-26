<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\MeritType;
use Illuminate\Http\Request;
use Inertia\Inertia;

class MeritTypeController extends Controller
{
    public function index()
    {
        return Inertia::render('Admin/MeritManagement', [
            'meritTypes' => MeritType::orderBy('points', 'desc')->orderBy('created_at', 'desc')->get(),
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'code' => 'required|string|max:50|unique:merit_types,code',
            'badge_color' => 'required|in:red,blue',
        ]);

        $validated['code'] = strtoupper(trim($validated['code']));
        $validated['points'] = $validated['badge_color'] === 'red' ? 2 : 1;

        MeritType::create($validated);

        return back();
    }

    public function update(Request $request, MeritType $meritType)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'code' => 'required|string|max:50|unique:merit_types,code,' . $meritType->id,
            'badge_color' => 'required|in:red,blue',
        ]);

        $validated['code'] = strtoupper(trim($validated['code']));
        $validated['points'] = $validated['badge_color'] === 'red' ? 2 : 1;

        $meritType->update($validated);

        return back();
    }

    public function destroy(MeritType $meritType)
    {
        $meritType->delete();

        return back();
    }
}