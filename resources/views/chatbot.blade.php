<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Edit Chatbot Information - Kolej Tun Razak</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
    <style>
        body { font-family: 'Inter', sans-serif; }
        .bg-ktr-maroon { background-color: #7b1113; }
        .text-ktr-maroon { color: #7b1113; }
        .border-ktr-maroon { border-color: #7b1113; }
    </style>
</head>
<body class="bg-gray-900 bg-opacity-40 flex items-center justify-center min-h-screen p-4">

    <!-- MODAL CONTAINER -->
    <div class="bg-white rounded-xl shadow-2xl max-w-3xl w-full overflow-hidden border border-gray-200">
        
        <!-- Modal Header -->
        <div class="px-6 py-4 border-b border-gray-200 flex items-center justify-between bg-white">
            <div class="flex items-center space-x-3">
                <div class="w-8 h-8 rounded-lg bg-red-50 text-ktr-maroon flex items-center justify-center font-bold text-sm border border-red-100">
                    🤖
                </div>
                <div>
                    <div class="flex items-center space-x-2">
                        <h2 class="text-base font-bold text-gray-900">Edit Chatbot Information</h2>
                        <span class="text-xs bg-gray-100 font-mono font-semibold px-2 py-0.5 rounded text-gray-700">
                            {{ $chatbot?->content_id ?? 'INFO-KTR-001' }}
                        </span>
                    </div>
                    <p class="text-xs text-gray-500">Modify the automated guidance returned by KTR Student Assistant to student queries.</p>
                </div>
            </div>
            <a href="#" class="text-gray-400 hover:text-gray-600 text-lg font-bold">&times;</a>
        </div>

        @if(session('success'))
            <div class="mx-6 mt-4 p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg text-xs font-medium">
                {{ session('success') }}
            </div>
        @endif

        <!-- Modal Form Body -->
        <form action="{{ route('chatbot.update', $chatbot?->id ?? 1) }}" method="POST" class="p-6 space-y-5">
            @csrf
            @method('PUT')

            <!-- Row 1: Category & Target Audience -->
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label class="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">Information Category *</label>
                    <select name="category" class="w-full px-3 py-2 rounded-lg border border-gray-300 text-xs font-medium focus:ring-2 focus:ring-[#7b1113] focus:outline-none bg-white">
                        <option value="Registration Guidelines" {{ ($chatbot?->category ?? '') == 'Registration Guidelines' ? 'selected' : '' }}>Registration Guidelines</option>
                        <option value="Registration Period" {{ ($chatbot?->category ?? '') == 'Registration Period' ? 'selected' : '' }}>Registration Period</option>
                        <option value="General Assistance" {{ ($chatbot?->category ?? '') == 'General Assistance' ? 'selected' : '' }}>General Assistance</option>
                    </select>
                </div>
                <div>
                    <label class="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">Target Audience / Cohort</label>
                    <div class="flex items-center justify-between px-3 py-2 rounded-lg border border-gray-300 bg-gray-50 text-xs">
                        <span class="text-gray-700 font-medium">👥 All Undergraduate Residents</span>
                        <span class="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded">Default</span>
                        <input type="hidden" name="target_audience" value="All Undergraduate Residents">
                    </div>
                </div>
            </div>

            <!-- Row 2: Information Title -->
            <div>
                <label class="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">Information Title *</label>
                <input type="text" name="title" value="{{ old('title', $chatbot?->title ?? 'Room Registration Procedures & Guidelines') }}" 
                       class="w-full px-3 py-2 rounded-lg border border-gray-300 text-xs focus:ring-2 focus:ring-[#7b1113] focus:outline-none font-medium">
            </div>

            <!-- Row 3: Quick Trigger Keywords / Tags -->
            <div>
                <label class="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">Quick Trigger Keywords / Match Tags</label>
                <div class="flex flex-wrap items-center gap-2 p-2 rounded-lg border border-gray-300 bg-white text-xs">
                    <span class="bg-red-50 text-ktr-maroon border border-red-200 px-2.5 py-1 rounded-md font-medium flex items-center gap-1">
                        registration <span class="cursor-pointer font-bold">×</span>
                    </span>
                    <span class="bg-red-50 text-ktr-maroon border border-red-200 px-2.5 py-1 rounded-md font-medium flex items-center gap-1">
                        guidelines <span class="cursor-pointer font-bold">×</span>
                    </span>
                    <span class="bg-red-50 text-ktr-maroon border border-red-200 px-2.5 py-1 rounded-md font-medium flex items-center gap-1">
                        room booking <span class="cursor-pointer font-bold">×</span>
                    </span>
                    <span class="bg-red-50 text-ktr-maroon border border-red-200 px-2.5 py-1 rounded-md font-medium flex items-center gap-1">
                        step by step <span class="cursor-pointer font-bold">×</span>
                    </span>
                    <input type="text" name="keywords" value="{{ old('keywords', $chatbot?->keywords ?? 'registration, guidelines, room booking, step by step') }}" placeholder="+ Add tag..." class="flex-1 outline-none text-xs px-2 py-1 min-w-[100px]">
                </div>
                <p class="text-[10px] text-gray-400 mt-1">Comma-separated terms that trigger this response in chat.</p>
            </div>

            <!-- Row 4: Information Content with Toolbar Simulation -->
            <div>
                <div class="flex items-center justify-between mb-1.5">
                    <label class="text-xs font-bold text-gray-700 uppercase tracking-wider">Information Content (Returned by Chatbot) *</label>
                    <span class="text-[10px] text-emerald-600 font-medium flex items-center gap-1">✓ Supports Markdown formatting</span>
                </div>
                <div class="border border-gray-300 rounded-lg overflow-hidden bg-white">
                    <!-- Toolbar -->
                    <div class="bg-gray-50 border-b border-gray-200 px-3 py-1.5 flex items-center space-x-3 text-xs text-gray-600 font-semibold">
                        <button type="button" class="hover:text-black font-bold">B</button>
                        <button type="button" class="hover:text-black italic">I</button>
                        <span class="text-gray-300">|</span>
                        <button type="button" class="hover:text-black">≡</button>
                        <button type="button" class="hover:text-black">1.</button>
                        <button type="button" class="hover:text-black">🔗</button>
                    </div>
                    <textarea name="content" rows="6" 
                              class="w-full p-3 text-xs focus:outline-none resize-y font-mono">{{ old('content', $chatbot?->content ?? "1. Check Registration Period: Ensure your cohort's window is active in the KTR Portal.\n2. Browse Available Blocks: Review room configurations for Block TR01 - TR06.\n3. Review Eligibility & Merit Cutoff: Verify minimum collegiate merit requirement (≥ 65 merit points).\n4. Select Desired Room & Bed: Choose your vacant bed slot (Bed A or Bed B).\n5. Confirm & Submit Reservation: Finalize acknowledgment of UTM Residential Regulations.\n6. Need Assistance? Contact your assigned Felo Penasihat Blok or visit the KTR Administration Office.") }}</textarea>
                </div>
            </div>

            <!-- Footer Meta & Actions -->
            <div class="pt-3 border-t border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div class="text-[11px] text-gray-500 flex items-center gap-1.5">
                    <span>⏱ Last Updated: <strong class="text-gray-700">{{ $chatbot?->updated_at ? $chatbot->updated_at->format('d M Y, h:i A') : '18 Nov 2026, 02:20 PM' }}</strong> by <strong class="text-gray-700">{{ $chatbot?->admin_id ?? 'En. Razak' }}</strong></span>
                </div>
                <div class="flex items-center space-x-2 w-full sm:w-auto justify-end">
                    <button type="reset" class="px-4 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-100 rounded-lg transition">Reset to Default</button>
                    <button type="submit" class="bg-ktr-maroon hover:bg-[#630e10] text-white text-xs font-semibold px-5 py-2 rounded-lg shadow-sm transition">
                        Save Changes
                    </button>
                </div>
            </div>
        </form>

        <!-- Approval Action Footer Bar -->
        <div class="bg-gray-50 px-6 py-3 border-t border-gray-200 flex items-center justify-between">
            <span class="text-xs text-gray-600 font-medium">
                Current Workflow Status: <span class="uppercase font-bold px-2 py-0.5 rounded text-[10px] {{ ($chatbot?->status ?? 'pending') == 'submitted' ? 'bg-amber-100 text-amber-800' : 'bg-gray-200 text-gray-700' }}">{{ $chatbot?->status ?? 'pending' }}</span>
            </span>
          <form action="{{ route('chatbot.submit', $chatbot?->id ?? 1) }}" method="POST">
            @csrf
            <button type="submit" class="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold px-4 py-1.5 rounded-lg shadow-sm transition">
                Submit For Approval
            </button>
        </form>
        </div>

    </div>

</body>
</html>