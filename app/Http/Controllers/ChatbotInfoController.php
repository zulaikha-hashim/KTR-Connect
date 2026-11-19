<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\ChatbotInfo;
use App\Models\ChatbotInfoLog;
use Illuminate\Validation\Rule;

class ChatbotInfoController extends Controller
{
    public function update(Request $request, $id)
    {
        $validated = $request->validate([
            'category' => 'required|string',
            'target_audience' => 'required|string',
            'title' => 'required|string|max:255',
            'keywords' => 'nullable|string',
            'content' => 'required|string',
            'faqs' => 'nullable|array|max:20',
            'faqs.*.question' => 'required|string|max:255',
            'faqs.*.answer' => 'required|string|max:2000',
            'status' => ['nullable', Rule::in(['draft', 'pending'])],
        ]);

        $chatbot = ChatbotInfo::findOrFail($id);
        $status = $validated['status'] ?? 'pending';
        $chatbot->update([
            'category' => $validated['category'],
            'target_audience' => $validated['target_audience'],
            'title' => $validated['title'],
            'keywords' => $validated['keywords'] ?? null,
            'content' => $validated['content'],
            'faqs' => $validated['faqs'] ?? $chatbot->faqs ?? [],
            'admin_id' => 'En. Razak', // Track current admin
            'status' => $status,
        ]);

        ChatbotInfoLog::create([
            'chatbot_info_id' => $chatbot->id,
            'action' => $status === 'draft' ? 'Draft saved' : 'Changes submitted for review',
            'status' => $status,
            'admin_id' => $chatbot->admin_id,
        ]);

        return redirect()->route('admin', ['modal' => 'chatbot'])->with('success', 'Saved Successfully');
    }

    public function deploy($id)
    {
        $chatbot = ChatbotInfo::findOrFail($id);
        abort_unless(
            in_array($chatbot->status, ['draft', 'pending'], true),
            409,
            'Save the chatbot as a draft before deploying it.',
        );

        $chatbot->update([
            'status' => 'deployed',
        ]);

        ChatbotInfoLog::create([
            'chatbot_info_id' => $chatbot->id,
            'action' => 'Chatbot deployed',
            'status' => 'deployed',
            'admin_id' => $chatbot->admin_id,
        ]);

        return redirect()->route('admin', ['modal' => 'chatbot'])->with('success', 'Chatbot deployed successfully.');
    }
}