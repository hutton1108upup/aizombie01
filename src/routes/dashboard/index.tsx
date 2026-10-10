import { createFileRoute } from '@tanstack/react-router';
import { MyVideos } from '@/components/aizombie/my-videos';

export const Route = createFileRoute('/dashboard/')({ component: MyVideos });
