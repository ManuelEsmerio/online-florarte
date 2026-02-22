// src/lib/data/announcement-data.ts
import type { Announcement } from '@/lib/definitions';

export let announcementsData: Announcement[] = [
    {
        id: 1,
        title: "¡Día de las Madres!",
        description: "Encuentra el regalo perfecto para mamá. Descuentos especiales en ramos de rosas y orquídeas.",
        button_text: "Ver Regalos",
        button_link: "/categories/arreglos-florales",
        image_url: "images/announcements/1/banner-mothers-day.webp",
        image_mobile_url: "images/announcements/1/banner-mothers-day-mobile.webp",
        is_active: true,
        start_at: "2024-05-01T00:00:00Z",
        end_at: "2024-05-11T23:59:59Z",
        sort_order: 1,
        created_at: "2024-04-20T10:00:00Z",
        updated_at: "2024-04-20T10:00:00Z"
    },
    {
        id: 2,
        title: "Envío Gratis en Tequila",
        description: "Disfruta de envío sin costo en todos los pedidos dentro de Tequila, Jalisco.",
        button_text: "Comprar Ahora",
        button_link: "/products/all",
        image_url: "images/announcements/2/banner-free-shipping.webp",
        image_mobile_url: null,
        is_active: true,
        start_at: null,
        end_at: null,
        sort_order: 2,
        created_at: "2024-01-15T10:00:00Z",
        updated_at: "2024-01-15T10:00:00Z"
    },
    {
        id: 3,
        title: "Nuevos Arreglos de Girasoles",
        description: "Llena de alegría su día con nuestra nueva colección de arreglos de girasoles.",
        button_text: "Descubrir",
        button_link: "/categories/girasoles",
        image_url: "images/announcements/3/banner-sunflowers.webp",
        image_mobile_url: null,
        is_active: false,
        start_at: null,
        end_at: null,
        sort_order: 3,
        created_at: "2024-03-10T10:00:00Z",
        updated_at: "2024-03-10T10:00:00Z"
    }
];
