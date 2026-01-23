import { http, HttpResponse } from 'msw';

// State to simulate persistence during test run (optional, but good for chaining tests)
const users = new Map([
  [
    1,
    {
      id: 1,
      email: 'george.bluth@reqres.in',
      first_name: 'George',
      last_name: 'Bluth',
      avatar: 'https://reqres.in/img/faces/1-image.jpg',
    },
  ],
  [
    2,
    {
      id: 2,
      email: 'janet.weaver@reqres.in',
      first_name: 'Janet',
      last_name: 'Weaver',
      avatar: 'https://reqres.in/img/faces/2-image.jpg',
    },
  ],
  [
    3,
    {
      id: 3,
      email: 'emma.wong@reqres.in',
      first_name: 'Emma',
      last_name: 'Wong',
      avatar: 'https://reqres.in/img/faces/3-image.jpg',
    },
  ],
]);

export const handlers = [
  // GET /api/users (List users)
  http.get('*/api/users', ({ request }) => {
    const url = new URL(request.url);
    const page = Number(url.searchParams.get('page') || 1);
    const perPage = 6;

    // Simulate pagination for page 1 and 2
    const total = 12;
    const totalPages = 2;

    const data = Array.from(users.values());

    return HttpResponse.json({
      page,
      per_page: perPage,
      total,
      total_pages: totalPages,
      data: data, // Returning all for simplicity, or slice if strictly needed
      support: {
        url: 'https://reqres.in/#support-heading',
        text: 'To keep ReqRes free, contributions towards server costs are appreciated!',
      },
    });
  }),

  // GET /api/users/:id (Single user)
  http.get('*/api/users/:id', ({ params }) => {
    const { id } = params;
    const user = users.get(Number(id));

    if (!user) {
      return new HttpResponse(null, { status: 404 });
    }

    return HttpResponse.json({
      data: user,
      support: {
        url: 'https://reqres.in/#support-heading',
        text: 'To keep ReqRes free, contributions towards server costs are appreciated!',
      },
    });
  }),

  // POST /api/users (Create user)
  http.post('*/api/users', async ({ request }) => {
    const body = (await request.json()) as Record<string, unknown>;

    return HttpResponse.json(
      {
        ...body,
        id: String(users.size + 100), // Mock ID
        createdAt: new Date().toISOString(),
      },
      { status: 201 }
    );
  }),

  // PUT /api/users/:id (Update user)
  http.put('*/api/users/:id', async ({ request }) => {
    const body = (await request.json()) as Record<string, unknown>;

    return HttpResponse.json({
      ...body,
      updatedAt: new Date().toISOString(),
    });
  }),

  // PATCH /api/users/:id (Patch user)
  http.patch('*/api/users/:id', async ({ request }) => {
    const body = (await request.json()) as Record<string, unknown>;

    return HttpResponse.json({
      ...body,
      updatedAt: new Date().toISOString(),
    });
  }),

  // DELETE /api/users/:id (Delete user)
  http.delete('*/api/users/:id', () => {
    return new HttpResponse(null, { status: 204 });
  }),

  // POST /api/login (Login)
  http.post('*/api/login', async ({ request }) => {
    const body = (await request.json()) as { password?: string };

    if (!body.password) {
      return HttpResponse.json({ error: 'Missing password' }, { status: 400 });
    }

    return HttpResponse.json({ token: 'QpwL5tke4Pnpja7X4' });
  }),

  // POST /api/register (Register)
  http.post('*/api/register', async ({ request }) => {
    const body = (await request.json()) as { password?: string };

    if (!body.password) {
      return HttpResponse.json({ error: 'Missing password' }, { status: 400 });
    }

    return HttpResponse.json({
      id: 4,
      token: 'QpwL5tke4Pnpja7X4',
    });
  }),
];
