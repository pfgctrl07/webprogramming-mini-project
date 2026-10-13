import React from 'react';
import PropTypes from 'prop-types';

/**
 * UrgentTaskClock - a CLASS component (Unit IV: constructors and
 * the component lifecycle). Functional components with Hooks cover
 * almost everything elsewhere in this demo; this component exists
 * specifically to show the class-based API: a constructor that
 * initializes state, componentDidMount/componentWillUnmount for a
 * ticking interval, and componentDidUpdate reacting to new props.
 */
class UrgentTaskClock extends React.Component {
  constructor(props) {
    super(props);
    // Constructor: set up initial state exactly once.
    this.state = { now: new Date() };
  }

  componentDidMount() {
    // Mounting lifecycle: start the ticking clock once the component
    // is actually in the DOM.
    this.intervalId = setInterval(() => {
      this.setState({ now: new Date() });
    }, 1000);
  }

  componentDidUpdate(prevProps) {
    // Updating lifecycle: react if the parent hands us a different
    // "most urgent task" (e.g. after the user marks one complete).
    if (prevProps.mostUrgentTask?.id !== this.props.mostUrgentTask?.id) {
      // no-op side effect placeholder: this is where a real app
      // might re-sync an external API or trigger a notification.
    }
  }

  componentWillUnmount() {
    // Unmounting lifecycle: always clear timers/listeners started in
    // componentDidMount to avoid leaking them.
    clearInterval(this.intervalId);
  }

  render() {
    const { mostUrgentTask } = this.props;
    const { now } = this.state;

    if (!mostUrgentTask) {
      return (
        <div className="urgent-clock">
          <p>No pending tasks - nothing urgent right now.</p>
        </div>
      );
    }

    const diffMs = new Date(mostUrgentTask.deadline).getTime() - now.getTime();
    const overdue = diffMs < 0;
    const abs = Math.abs(diffMs);
    const hours = Math.floor(abs / 3600000);
    const minutes = Math.floor((abs % 3600000) / 60000);
    const seconds = Math.floor((abs % 60000) / 1000);

    return (
      <div className="urgent-clock">
        <p className="urgent-clock-label">Most urgent: {mostUrgentTask.title}</p>
        <p className={`urgent-clock-value ${overdue ? 'is-overdue' : ''}`}>
          {overdue ? 'Overdue by ' : 'Time left: '}
          {String(hours).padStart(2, '0')}:{String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
        </p>
      </div>
    );
  }
}

UrgentTaskClock.propTypes = {
  mostUrgentTask: PropTypes.shape({
    id: PropTypes.number,
    title: PropTypes.string,
    deadline: PropTypes.string,
  }),
};

UrgentTaskClock.defaultProps = {
  mostUrgentTask: null,
};

export default UrgentTaskClock;
