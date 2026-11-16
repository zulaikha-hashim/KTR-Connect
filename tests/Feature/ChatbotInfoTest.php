<?php

namespace Tests\Feature;

use App\Models\ChatbotInfo;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class ChatbotInfoTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_initializes_chatbot_record_when_none_exists(): void
    {
        $this->get('/admin?modal=chatbot')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Admin')
                ->where('showChatbot', true)
                ->where('chatbot.content_id', 'INFO-KTR-001')
                ->where('chatbot.status', 'not deployed'));

        $this->assertDatabaseHas('chatbot_infos', [
            'id' => 1,
            'content_id' => 'INFO-KTR-001',
            'status' => 'not deployed',
        ]);
    }

    public function test_saving_chatbot_information_redirects_to_admin_with_success_message(): void
    {
        $chatbot = ChatbotInfo::create([
            'title' => 'Old chatbot title',
            'content' => 'Old chatbot content',
        ]);

        $this->from('/admin?modal=chatbot')
            ->put("/chatbot-info/{$chatbot->id}", [
                'category' => 'Registration Guidelines',
                'target_audience' => 'All Undergraduate Residents',
                'title' => 'Updated chatbot title',
                'keywords' => 'registration, rooms',
                'content' => 'Updated chatbot content',
            ])
            ->assertRedirect(route('admin'))
            ->assertSessionHas('success', 'Saved Successfully');

        $this->assertDatabaseHas('chatbot_infos', [
            'id' => $chatbot->id,
            'title' => 'Updated chatbot title',
            'status' => 'pending',
        ]);

        $this->get(route('admin'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Admin')
                ->where('showChatbot', false)
                ->where('successMessage', 'Saved Successfully'));
    }

    public function test_deploying_chatbot_redirects_to_admin_and_marks_it_deployed(): void
    {
        $chatbot = ChatbotInfo::create([
            'title' => 'Room registration guidance',
            'content' => 'Current registration instructions.',
            'status' => 'pending',
        ]);

        $this->post("/chatbot-info/{$chatbot->id}/deploy")
            ->assertRedirect(route('admin'))
            ->assertSessionHas('success', 'Chatbot deployed successfully.');

        $this->assertDatabaseHas('chatbot_infos', [
            'id' => $chatbot->id,
            'status' => 'deployed',
        ]);
    }
}