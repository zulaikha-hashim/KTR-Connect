<?php

namespace App\Http\Controllers\Staff;

use App\Http\Controllers\Controller;
use App\Models\MeritType;
use Illuminate\Http\Request;
use Inertia\Inertia;

class MeritTypeController extends Controller
{
    public function index()
    {
        return Inertia::render('Staff/MeritTypes', [
            'meritTypes' => MeritType::orderBy('points', 'desc')->get(),
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:100',
            'code' => 'required|string|max:30|unique:merit_types,code',
            'points' => 'required|integer|min:1',
            'badge_color' => 'required|in:crimson,blue',
            'criteria' => 'nullable|string|max:500',
            'semester_cap' => 'nullable|integer|min:1',
            'is_active' => 'boolean',
        ]);

        MeritType::create($validated);

        return redirect()->back()->with('success', 'Merit type created successfully.');
    }

    public function update(Request $request, MeritType $meritType)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:100',
            'code' => 'required|string|max:30|unique:merit_types,code,' . $meritType->id,
            'points' => 'required|integer|min:1',
            'badge_color' => 'required|in:crimson,blue',
            'criteria' => 'nullable|string|max:500',
            'semester_cap' => 'nullable|integer|min:1',
            'is_active' => 'boolean',
        ]);

        $meritType->update($validated);

        return redirect()->back()->with('success', 'Merit type updated successfully.');
    }

    public function destroy(MeritType $meritType)
    {
        $meritType->delete();

        return redirect()->back()->with('success', 'Merit type deleted successfully.');
    }
}