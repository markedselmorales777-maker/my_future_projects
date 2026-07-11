import random
import time


def main():
    name = input("Enter your name: ")
    print(f"Hello {name}")
    print("Random number:", random.randint(1, 10))
    time.sleep(0.2)
    print("Done.")


if __name__ == "__main__":
    main()
