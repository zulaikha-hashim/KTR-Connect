<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\ChatbotInfo;

class ChatbotInfoController extends Controller
{
    public function update(Request $request, $id)
    {
        $request->validate([
            'category' => 'required|string',
            'target_audience' => 'required|string',
            'title' => 'required|string|max:255',
            'keywords' => 'nullable|string',
            'content' => 'required|string',
        ]);

        $chatbot = ChatbotInfo::findOrFail($id);
        $chatbot->update([
            'category' => $request->category,
            'target_audience' => $request->target_audience,
            'title' => $request->title,
            'keywords' => $request->keywords,
            'content' => $request->content,
            'admin_id' => 'En. Razak', // Track current admin
            'status' => 'pending', // Resets approval status on edit
        ]);

        return redirect()->back()->with('success', 'Chatbot information updated successfully!');
    }

    public function submitApproval($id)
    {
        $chatbot = ChatbotInfo::findOrFail($id);
        $chatbot->update([
            'status' => 'submitted',
        ]);

        return redirect()->back()->with('success', 'Submitted for collegiate approval successfully!');
    }
}