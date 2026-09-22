export type Circle = {
  _id: string;
  name: string;
  description?: string;
  members?: string[];
  admins?: string[];
};

export async function getCircle(
  circleId: string,
): Promise<Circle> {
  const token =
    localStorage.getItem("token");

  const response = await fetch(
    `/api/circles/${circleId}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  );

  if (!response.ok) {
    throw new Error(
      "Failed to load Circle",
    );
  }

  const data = await response.json();

  return data.circle;
}
export async function editCircle(
  circleId: string,
  data: {
    name: string;
    description?: string;
  },
): Promise<Circle> {
  const token =
    localStorage.getItem("token");

  const response = await fetch(
    `/api/circles/${circleId}`,
    {
      method: "PATCH",

      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },

      body: JSON.stringify(data),
    },
  );

  const result =
    await response.json();

  if (!response.ok) {
    throw new Error(
      result.message ||
        "Failed to update Circle",
    );
  }

  return result.circle;
}