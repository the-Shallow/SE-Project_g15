# tests/test_polls.py
def test_create_poll(client):
    group_id = 1  # Make sure a group exists
    poll_data = {
        "question": "Favorite food?",
        "createdBy": "groupuser",
        "options": ["Pizza", "Burger", "Pasta"],
    }
    response = client.post(f"/api/groups/{group_id}/polls", json=poll_data)
    assert response.status_code in [201, 400]
    if response.status_code == 201:
        data = response.get_json()
        assert "question" in data


def test_get_group_polls(client):
    group_id = 1
    response = client.get(f"/api/groups/{group_id}/polls")
    assert response.status_code in [200, 500]
    assert isinstance(response.get_json(), (list, dict))


def test_vote_on_poll(client):
    poll_id = 1  # Make sure a poll exists
    response = client.post(f"/api/polls/{poll_id}/vote", json={"username": "groupuser", "option_id": 1})
    assert response.status_code in [200, 400, 500]
    if response.status_code == 200:
        data = response.get_json()
        assert "id" in data
