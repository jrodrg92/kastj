/**
 * Deterministic execution engine for verifiable state transitions.
 * 
 * S: State type
 * C: Command type
 */
export interface ExecutionEngine<S, C> {
    /**
     * Applies a command to the current state and returns the new state.
     * Must be pure and deterministic.
     */
    apply(state: S, command: C): S;

    /**
     * Computes a cryptographic commitment (e.g. hash) of the state.
     */
    commitment(state: S): string;
}
