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
            ->assertRedirect(route('admin', ['modal' => 'chatbot']))
            ->assertSessionHas('success', 'Saved Successfully');

        $this->assertDatabaseHas('chatbot_infos', [
            'id' => $chatbot->id,
            'title' => 'Updated chatbot title',
            'status' => 'pending',
        ]);

        $this->get(route('admin', ['modal' => 'chatbot']))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Admin')
                ->where('showChatbot', true)
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
            ->assertRedirect(route('admin', ['modal' => 'chatbot']))
            ->assertSessionHas('success', 'Chatbot deployed successfully.');

        $this->assertDatabaseHas('chatbot_infos', [
            'id' => $chatbot->id,
            'status' => 'deployed',
        ]);

        $this->assertDatabaseHas('chatbot_info_logs', [
            'chatbot_info_id' => $chatbot->id,
            'action' => 'Chatbot deployed',
            'status' => 'deployed',
        ]);
    }

    public function test_chatbot_cannot_be_deployed_until_changes_are_saved(): void
    {
        $chatbot = ChatbotInfo::create([
            'title' => 'Room registration guidance',
            'content' => 'Current registration instructions.',
            'status' => 'not deployed',
        ]);

        $this->post("/chatbot-info/{$chatbot->id}/deploy")
            ->assertStatus(409);

        $this->assertDatabaseHas('chatbot_infos', [
            'id' => $chatbot->id,
            'status' => 'not deployed',
        ]);
        $this->assertDatabaseMissing('chatbot_info_logs', [
            'chatbot_info_id' => $chatbot->id,
        ]);
    }

    public function test_chatbot_faqs_can_be_saved_as_a_draft_and_appear_in_the_activity_log(): void
    {
        $chatbot = ChatbotInfo::create([
            'title' => 'Room registration guidance',
            'content' => 'Current registration instructions.',
        ]);
        $faqs = [
            ['question' => 'When can I register?', 'answer' => 'Check the KTR Portal.'],
        ];

        $this->put("/chatbot-info/{$chatbot->id}", [
            'category' => 'Registration Guidelines',
            'target_audience' => 'All Undergraduate Residents',
            'title' => 'Room registration guidance',
            'keywords' => 'registration',
            'content' => 'Current registration instructions.',
            'faqs' => $faqs,
            'status' => 'draft',
        ])->assertRedirect(route('admin', ['modal' => 'chatbot']));

        $this->assertSame($faqs, $chatbot->fresh()->faqs);
        $this->assertDatabaseHas('chatbot_infos', [
            'id' => $chatbot->id,
            'status' => 'draft',
        ]);
        $this->assertDatabaseHas('chatbot_info_logs', [
            'chatbot_info_id' => $chatbot->id,
            'action' => 'Draft saved',
            'status' => 'draft',
        ]);

        $this->get('/admin?modal=chatbot')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->where('chatbot.status', 'draft')
                ->where('chatbot.faqs.0.question', 'When can I register?')
                ->has('chatbotLogs', 1)
                ->where('chatbotLogs.0.action', 'Draft saved'));
    }

    public function test_chatbot_faq_questions_and_answers_are_required(): void
    {
        $chatbot = ChatbotInfo::create([
            'title' => 'Room registration guidance',
            'content' => 'Current registration instructions.',
        ]);

        $this->from('/admin?modal=chatbot')
            ->put("/chatbot-info/{$chatbot->id}", [
                'category' => 'Registration Guidelines',
                'target_audience' => 'All Undergraduate Residents',
                'title' => 'Room registration guidance',
                'content' => 'Current registration instructions.',
                'faqs' => [['question' => '', 'answer' => '']],
                'status' => 'draft',
            ])
            ->assertRedirect('/admin?modal=chatbot')
            ->assertSessionHasErrors(['faqs.0.question', 'faqs.0.answer']);

        $this->assertDatabaseMissing('chatbot_info_logs', [
            'chatbot_info_id' => $chatbot->id,
        ]);
    }
}