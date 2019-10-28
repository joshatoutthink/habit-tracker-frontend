import React, { useState, useEffect } from "react";

import { navigate } from "@reach/router";
import { useQuery, useMutation } from "@apollo/react-hooks";

import gql from "graphql-tag";
import { ME_QUERY } from "../App";
import { isCompletedToday } from "./Dash";

const DELETE_HABIT_MUTATION = gql`
  mutation DELETE_HABIT_MUTATION($habit_id: ID!) {
    DeleteHabit(habit_id: $habit_id) {
      habit_id
    }
  }
`;

const UPDATE_HABIT_MUTATION = gql`
  mutation UPDATE_HABIT_MUTATION($habit_id: ID!, $habit_name: String!) {
    UpdateHabit(habit_id: $habit_id, habit_name: $habit_name) {
      habit_id
      habit_name
      habit_created_at
      times_completed {
        time
      }
    }
  }
`;

const COMPLETE_HABIT_MUTATION = gql`
  mutation COMPLETE_HABIT_MUTATION($habit_id: ID!) {
    CompleteAHabit(habit_id: $habit_id) {
      habit_id
      habit_name
      habit_created_at
      times_completed {
        time
      }
    }
  }
`;

const Habit = ({
  id,
  name,
  habit_created_at,
  completed_last,
  times_completed,
}) => {
  //* DELETE THE HABIT
  const [deleteHabit, { error, loading }] = useMutation(DELETE_HABIT_MUTATION, {
    variables: {
      habit_id: id,
    },
    update(cache, payload) {
      const data = cache.readQuery({ query: ME_QUERY });
      const newData = data.Me.habits.filter(({ habit_id }) => habit_id !== id);
      data.Me.habits = newData;
      cache.writeQuery({
        query: ME_QUERY,
        data,
      });
    },
    optimisticResponse: {
      __typename: "Mutation",
      DeleteHabit: {
        __typename: Habit,
        habit_id: id,
      },
    },
  });

  //* UPDATE THE HABIT
  const [isBeingEdited, setIsBeingEdited] = useState(false);
  const [newHabitName, setNewHabitName] = useState(name);

  const handleSetIsBeingEdited = () => {
    setIsBeingEdited(!isBeingEdited);
  };

  //* IS THE HABIT COMPLETED
  const [isCompleted, setIsCompleted] = useState(false);
  useEffect(() => {
    setIsCompleted(isCompletedToday(completed_last));
  }, [completed_last]);
  //* COMPLETE THE HABIT
  const [completeAHabit] = useMutation(COMPLETE_HABIT_MUTATION, {
    variables: {
      habit_id: id,
    },
    update(cache, payload) {
      const data = cache.readQuery({ query: ME_QUERY });
      const removeOldData = data.Me.habits.filter(
        ({ habit_id }) => habit_id !== payload.data.CompleteAHabit.habit_id
      );
      const newData = [...removeOldData, payload.data.CompleteAHabit];
      data.Me.habits = newData;

      cache.writeQuery({
        query: ME_QUERY,
        data,
      });
    },
    optimisticResponse: {
      __typename: "Mutation",
      CompleteAHabit: {
        __typename: Habit,
        habit_id: id,
        habit_name: name,
        habit_created_at,
        times_completed,
      },
    },
  });
  const handleCompleteHabit = () => {
    completeAHabit();
  };
  return (
    <li
      style={{
        display: "flex",
        justifyContent: "space-between",
        borderLeft: isCompleted ? "3px solid green" : "3px solid red",
      }}
    >
      <button onClick={handleCompleteHabit}>
        <span role='img' aria-label='check'>
          ✅
        </span>
      </button>
      <button
        onClick={() => navigate(`/dashboard/${id}`)}
        style={{ background: "transparent" }}
      >
        <h4>{name}</h4>
      </button>
      <button onClick={deleteHabit}>
        <span role='img' aria-label='check'>
          ❌ DELETE
        </span>
      </button>
    </li>
  );
};

export default Habit;