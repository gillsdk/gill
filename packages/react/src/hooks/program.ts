// TODO: Replace any with inferred types.

"use client";

import { useMutation, type UseMutationOptions, useQueryClient } from "@tanstack/react-query";
import type { Address, Instruction } from "gill";

import { GILL_HOOK_CLIENT_KEY } from "../const.js";

type InstructionBuilder<TInput = any> = (input: TInput, config?: { programAddress?: Address }) => Instruction;

type ProgramHookConfig<TInstructions extends Record<string, InstructionBuilder<any>>> = {
  instructions: TInstructions;
  programAddress?: Address;
};

type UseProgramInput<
  TInstructions extends Record<string, InstructionBuilder<any>>,
  TInstructionName extends keyof TInstructions,
> = UseMutationOptions<Instruction, Error, Parameters<TInstructions[TInstructionName]>[0]> & {
  instruction: TInstructionName;
};

export function createProgramHook<TInstructions extends Record<string, InstructionBuilder<any>>>(
  config: ProgramHookConfig<TInstructions>,
) {
  return function useProgram<TInstructionName extends keyof TInstructions>(
    input: UseProgramInput<TInstructions, TInstructionName>,
  ) {
    const queryClient = useQueryClient();
    const { instruction, ...options } = input;
    const instructionFn = config.instructions[instruction];

    return useMutation({
      ...options,
      // eslint-disable-next-line -- no await yet.
      mutationFn: async (instructionInput: Parameters<TInstructions[TInstructionName]>[0]) => {
        const instruction = instructionFn(instructionInput, {
          programAddress: config.programAddress,
        });

        instruction.accounts
          ?.map((account) => account.address)
          ?.forEach((address) => {
            void queryClient.invalidateQueries({
              queryKey: [GILL_HOOK_CLIENT_KEY, "some_cache_key", address],
            });
          });

        return instruction;
      },
    });
  };
}
