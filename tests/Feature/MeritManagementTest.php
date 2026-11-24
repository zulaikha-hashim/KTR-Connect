<?php

namespace Tests\Feature;

use App\Models\MeritType;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class MeritManagementTest extends TestCase
{
    use RefreshDatabase;

    public function test_merit_page_contains_csrf_token_for_inertia_mutations(): void
    {
        $this->get(route('admin.master-data.merit.index'))
            ->assertOk()
            ->assertSee('name="csrf-token" content="', false);
    }

    public function test_admin_can_create_merit_type_and_points_follow_badge_color(): void
    {
        $this->from(route('admin.master-data.merit.index'))
            ->post(route('admin.master-data.merit.store'), [
                'name' => 'Leadership Award',
                'code' => 'lead-red',
                'badge_color' => 'red',
                'points' => 1,
            ])
            ->assertRedirect(route('admin.master-data.merit.index'));

        $this->assertDatabaseHas('merit_types', [
            'name' => 'Leadership Award',
            'code' => 'LEAD-RED',
            'badge_color' => 'red',
            'points' => 2,
        ]);
    }

    public function test_admin_can_update_bound_merit_type(): void
    {
        $meritType = MeritType::create([
            'name' => 'Old Award',
            'code' => 'OLD-AWARD',
            'badge_color' => 'red',
            'points' => 2,
        ]);

        $this->from(route('admin.master-data.merit.index'))
            ->put(route('admin.master-data.merit.update', $meritType), [
                'name' => 'Updated Award',
                'code' => 'updated-award',
                'badge_color' => 'blue',
                'points' => 2,
            ])
            ->assertRedirect(route('admin.master-data.merit.index'));

        $this->assertDatabaseHas('merit_types', [
            'id' => $meritType->id,
            'name' => 'Updated Award',
            'code' => 'UPDATED-AWARD',
            'badge_color' => 'blue',
            'points' => 1,
        ]);
    }

    public function test_admin_can_delete_merit_type(): void
    {
        $meritType = MeritType::create([
            'name' => 'Temporary Award',
            'code' => 'TEMP-AWARD',
            'badge_color' => 'blue',
            'points' => 1,
        ]);

        $this->from(route('admin.master-data.merit.index'))
            ->delete(route('admin.master-data.merit.destroy', $meritType))
            ->assertRedirect(route('admin.master-data.merit.index'));

        $this->assertDatabaseMissing('merit_types', [
            'id' => $meritType->id,
        ]);
    }
}
