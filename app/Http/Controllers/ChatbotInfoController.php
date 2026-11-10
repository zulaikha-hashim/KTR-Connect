<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\ChatbotInfo;

class ChatbotInfoController extends Controller
{
    // Update the chatbot information
    public function update(Request $request, $id)
    {
        $request->validate([
            'title' => 'required|string|max:255',
            'content' => 'required|string',
        ]);

        $chatbot = ChatbotInfo::findOrFail($id);
        $chatbot->update([
            'title' => $request->title,
            'content' => $request->content,
            'status' => 'pending', 
        ]);

        return redirect()->back()->with('success', 'Chatbot information updated successfully!');
    }

    // Submit for approval action
    public function submitApproval($id)
    {
        $chatbot = ChatbotInfo::findOrFail($id);
        $chatbot->update([
            'status' => 'submitted',
        ]);

        return redirect()->back()->with('success', 'Submitted for approval successfully!');
    }
}