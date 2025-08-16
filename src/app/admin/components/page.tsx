"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { BellRing, Check, ChevronsUpDown, Moon, Plus, Sun } from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "~/components/ui/accordion";
import { Alert, AlertDescription, AlertTitle } from "~/components/ui/alert";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "~/components/ui/alert-dialog";
import { Button } from "~/components/ui/button";
import { AspectRatio } from "~/components/ui/aspect-ratio";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import { Badge } from "~/components/ui/badge";
import { Calendar } from "~/components/ui/calendar";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { Checkbox } from "~/components/ui/checkbox";
import { Label } from "~/components/ui/label";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "~/components/ui/collapsible";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "~/components/ui/command";
import {
  ContextMenu,
  ContextMenuCheckboxItem,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuLabel,
  ContextMenuRadioGroup,
  ContextMenuRadioItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "~/components/ui/context-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "~/components/ui/dialog";
import { Input } from "~/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "~/components/ui/form";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "~/components/ui/hover-card";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "~/components/ui/input-otp";
import {
  Menubar,
  MenubarContent,
  MenubarItem,
  MenubarMenu,
  MenubarSeparator,
  MenubarTrigger,
} from "~/components/ui/menubar";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "~/components/ui/navigation-menu";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "~/components/ui/pagination";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "~/components/ui/popover";
import { Progress } from "~/components/ui/progress";
import { RadioGroup, RadioGroupItem } from "~/components/ui/radio-group";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "~/components/ui/resizable";
import { ScrollArea } from "~/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { Separator } from "~/components/ui/separator";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "~/components/ui/sheet";
import { Skeleton } from "~/components/ui/skeleton";
import { Slider } from "~/components/ui/slider";
import { Switch } from "~/components/ui/switch";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs";
import { Textarea } from "~/components/ui/textarea";
import { Toggle } from "~/components/ui/toggle";
import { ToggleGroup, ToggleGroupItem } from "~/components/ui/toggle-group";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "~/components/ui/tooltip";

const AdminComponentsPage = () => {
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [showCollapsible, setShowCollapsible] = useState(false);
  const [position, setPosition] = useState(50);

  // For form example
  const formSchema = z.object({
    username: z.string().min(2).max(50),
  });

  type FormData = z.infer<typeof formSchema>;

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema) as any,
    defaultValues: {
      username: "",
    },
  });

  function onSubmit(values: FormData) {
    console.log(values);
  }

  return (
    <div className="container mx-auto p-8">
      <h1 className="mb-8 text-3xl font-bold">Shadcn UI Components</h1>

      <div className="grid gap-10">
        {/* Accordion */}
        <section id="accordion" className="rounded-lg border p-6">
          <h2 className="mb-4 text-2xl font-bold">Accordion</h2>
          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="item-1">
              <AccordionTrigger>Is it accessible?</AccordionTrigger>
              <AccordionContent>
                Yes. It adheres to the WAI-ARIA design pattern.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-2">
              <AccordionTrigger>Is it styled?</AccordionTrigger>
              <AccordionContent>
                Yes. It comes with default styles that matches the other
                components.
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </section>

        {/* Alert */}
        <section id="alert" className="rounded-lg border p-6">
          <h2 className="mb-4 text-2xl font-bold">Alert</h2>
          <Alert>
            <AlertTitle>Heads up!</AlertTitle>
            <AlertDescription>
              You can add components to your app using the cli.
            </AlertDescription>
          </Alert>
        </section>

        {/* Alert Dialog */}
        <section id="alert-dialog" className="rounded-lg border p-6">
          <h2 className="mb-4 text-2xl font-bold">Alert Dialog</h2>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline">Show Alert Dialog</Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone. This will permanently delete
                  your account and remove your data from our servers.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction>Continue</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </section>

        {/* Aspect Ratio */}
        <section id="aspect-ratio" className="rounded-lg border p-6">
          <h2 className="mb-4 text-2xl font-bold">Aspect Ratio</h2>
          <div className="w-[300px]">
            <AspectRatio ratio={16 / 9}>
              <div className="flex h-full w-full items-center justify-center rounded-md bg-slate-100">
                16:9 Aspect Ratio
              </div>
            </AspectRatio>
          </div>
        </section>

        {/* Avatar */}
        <section id="avatar" className="rounded-lg border p-6">
          <h2 className="mb-4 text-2xl font-bold">Avatar</h2>
          <div className="flex gap-4">
            <Avatar>
              <AvatarImage src="https://github.com/shadcn.png" alt="@shadcn" />
              <AvatarFallback>CN</AvatarFallback>
            </Avatar>
            <Avatar>
              <AvatarFallback>JD</AvatarFallback>
            </Avatar>
          </div>
        </section>

        {/* Badge */}
        <section id="badge" className="rounded-lg border p-6">
          <h2 className="mb-4 text-2xl font-bold">Badge</h2>
          <div className="flex gap-2">
            <Badge>Default</Badge>
            <Badge variant="secondary">Secondary</Badge>
            <Badge variant="outline">Outline</Badge>
            <Badge variant="destructive">Destructive</Badge>
          </div>
        </section>

        {/* Button */}
        <section id="button" className="rounded-lg border p-6">
          <h2 className="mb-4 text-2xl font-bold">Button</h2>
          <div className="flex flex-wrap gap-2">
            <Button>Default</Button>
            <Button variant="destructive">Destructive</Button>
            <Button variant="outline">Outline</Button>
            <Button variant="secondary">Secondary</Button>
            <Button variant="ghost">Ghost</Button>
            <Button variant="link">Link</Button>
            <Button disabled>Disabled</Button>
            <Button>
              <span className="mr-2">With Icon</span>
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </section>

        {/* Calendar */}
        <section id="calendar" className="rounded-lg border p-6">
          <h2 className="mb-4 text-2xl font-bold">Calendar</h2>
          <Calendar
            mode="single"
            selected={date}
            onSelect={setDate}
            className="rounded-md border"
          />
        </section>

        {/* Card */}
        <section id="card" className="rounded-lg border p-6">
          <h2 className="mb-4 text-2xl font-bold">Card</h2>
          <Card>
            <CardHeader>
              <CardTitle>Notifications</CardTitle>
              <CardDescription>You have 3 unread messages.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4">
                <BellRing className="h-4 w-4" />
                <div className="space-y-1">
                  <p className="text-sm leading-none font-medium">
                    Push Notifications
                  </p>
                  <p className="text-muted-foreground text-sm">
                    Send notifications to device.
                  </p>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button variant="outline">Cancel</Button>
              <Button>Continue</Button>
            </CardFooter>
          </Card>
        </section>

        {/* Checkbox */}
        <section id="checkbox" className="rounded-lg border p-6">
          <h2 className="mb-4 text-2xl font-bold">Checkbox</h2>
          <div className="items-top flex space-x-2">
            <Checkbox id="terms" />
            <div className="grid gap-1.5 leading-none">
              <Label htmlFor="terms">Accept terms and conditions</Label>
              <p className="text-muted-foreground text-sm">
                You agree to our Terms of Service and Privacy Policy.
              </p>
            </div>
          </div>
        </section>

        {/* Collapsible */}
        <section id="collapsible" className="rounded-lg border p-6">
          <h2 className="mb-4 text-2xl font-bold">Collapsible</h2>
          <Collapsible
            open={showCollapsible}
            onOpenChange={setShowCollapsible}
            className="w-full"
          >
            <CollapsibleTrigger asChild>
              <Button variant="outline" className="w-full justify-between">
                Toggle <ChevronsUpDown className="h-4 w-4" />
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="mt-2 rounded-md border p-4">
              <p>Collapsible content here</p>
            </CollapsibleContent>
          </Collapsible>
        </section>

        {/* Command */}
        <section id="command" className="rounded-lg border p-6">
          <h2 className="mb-4 text-2xl font-bold">Command</h2>
          <Command className="rounded-lg border shadow-md">
            <CommandInput placeholder="Type a command or search..." />
            <CommandList>
              <CommandEmpty>No results found.</CommandEmpty>
              <CommandGroup heading="Suggestions">
                <CommandItem>Calendar</CommandItem>
                <CommandItem>Search</CommandItem>
                <CommandItem>Settings</CommandItem>
              </CommandGroup>
              <CommandSeparator />
              <CommandGroup heading="Theme">
                <CommandItem>
                  <Sun className="mr-2 h-4 w-4" />
                  Light
                </CommandItem>
                <CommandItem>
                  <Moon className="mr-2 h-4 w-4" />
                  Dark
                </CommandItem>
              </CommandGroup>
            </CommandList>
          </Command>
        </section>

        {/* Context Menu */}
        <section id="context-menu" className="rounded-lg border p-6">
          <h2 className="mb-4 text-2xl font-bold">Context Menu</h2>
          <ContextMenu>
            <ContextMenuTrigger className="flex h-[150px] w-[300px] items-center justify-center rounded-md border border-dashed text-sm">
              Right click here
            </ContextMenuTrigger>
            <ContextMenuContent className="w-64">
              <ContextMenuItem>Back</ContextMenuItem>
              <ContextMenuItem>Forward</ContextMenuItem>
              <ContextMenuItem>Reload</ContextMenuItem>
              <ContextMenuSeparator />
              <ContextMenuCheckboxItem>Show Bookmarks</ContextMenuCheckboxItem>
              <ContextMenuCheckboxItem>Show Full URLs</ContextMenuCheckboxItem>
              <ContextMenuSeparator />
              <ContextMenuRadioGroup value="pedro">
                <ContextMenuLabel>People</ContextMenuLabel>
                <ContextMenuSeparator />
                <ContextMenuRadioItem value="pedro">Pedro</ContextMenuRadioItem>
                <ContextMenuRadioItem value="colm">Colm</ContextMenuRadioItem>
              </ContextMenuRadioGroup>
            </ContextMenuContent>
          </ContextMenu>
        </section>

        {/* Dialog */}
        <section id="dialog" className="rounded-lg border p-6">
          <h2 className="mb-4 text-2xl font-bold">Dialog</h2>
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline">Open Dialog</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Edit profile</DialogTitle>
                <DialogDescription>
                  Make changes to your profile here. Click save when you&apos;re
                  done.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="name" className="text-right">
                    Name
                  </Label>
                  <Input
                    id="name"
                    value="Pedro Duarte"
                    className="col-span-3"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="username" className="text-right">
                    Username
                  </Label>
                  <Input
                    id="username"
                    value="@peduarte"
                    className="col-span-3"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button type="submit">Save changes</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </section>

        {/* Dropdown Menu */}
        <section id="dropdown-menu" className="rounded-lg border p-6">
          <h2 className="mb-4 text-2xl font-bold">Dropdown Menu</h2>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">Open</Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56">
              <DropdownMenuLabel>My Account</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuGroup>
                <DropdownMenuItem>
                  Profile
                  <DropdownMenuShortcut>⇧⌘P</DropdownMenuShortcut>
                </DropdownMenuItem>
                <DropdownMenuItem>
                  Billing
                  <DropdownMenuShortcut>⌘B</DropdownMenuShortcut>
                </DropdownMenuItem>
                <DropdownMenuItem>
                  Settings
                  <DropdownMenuShortcut>⌘S</DropdownMenuShortcut>
                </DropdownMenuItem>
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        </section>

        {/* Form */}
        <section id="form" className="rounded-lg border p-6">
          <h2 className="mb-4 text-2xl font-bold">Form</h2>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              <FormField
                control={form.control}
                name="username"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Username</FormLabel>
                    <FormControl>
                      <Input placeholder="shadcn" {...field} />
                    </FormControl>
                    <FormDescription>
                      This is your public display name.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit">Submit</Button>
            </form>
          </Form>
        </section>

        {/* Hover Card */}
        <section id="hover-card" className="rounded-lg border p-6">
          <h2 className="mb-4 text-2xl font-bold">Hover Card</h2>
          <HoverCard>
            <HoverCardTrigger asChild>
              <Button variant="link">@shadcn</Button>
            </HoverCardTrigger>
            <HoverCardContent className="w-80">
              <div className="flex justify-between space-x-4">
                <Avatar>
                  <AvatarImage src="https://github.com/shadcn.png" />
                  <AvatarFallback>CN</AvatarFallback>
                </Avatar>
                <div className="space-y-1">
                  <h4 className="text-sm font-semibold">@shadcn</h4>
                  <p className="text-sm">
                    The creator of shadcn/ui and Taxonomy.
                  </p>
                  <div className="flex items-center pt-2">
                    <Check className="mr-2 h-4 w-4" />
                    <span className="text-muted-foreground text-xs">
                      Joined December 2021
                    </span>
                  </div>
                </div>
              </div>
            </HoverCardContent>
          </HoverCard>
        </section>

        {/* Input */}
        <section id="input" className="rounded-lg border p-6">
          <h2 className="mb-4 text-2xl font-bold">Input</h2>
          <div className="grid w-full max-w-sm items-center gap-1.5">
            <Label htmlFor="email">Email</Label>
            <Input type="email" id="email" placeholder="Email" />
          </div>
        </section>

        {/* Input OTP */}
        <section id="input-otp" className="rounded-lg border p-6">
          <h2 className="mb-4 text-2xl font-bold">Input OTP</h2>
          <div className="flex flex-col space-y-2">
            <Label htmlFor="otp">One-Time Password</Label>
            <InputOTP maxLength={6}>
              <InputOTPGroup>
                <InputOTPSlot index={0} />
                <InputOTPSlot index={1} />
                <InputOTPSlot index={2} />
              </InputOTPGroup>
              <InputOTPGroup>
                <InputOTPSlot index={3} />
                <InputOTPSlot index={4} />
                <InputOTPSlot index={5} />
              </InputOTPGroup>
            </InputOTP>
          </div>
        </section>

        {/* Label */}
        <section id="label" className="rounded-lg border p-6">
          <h2 className="mb-4 text-2xl font-bold">Label</h2>
          <div className="flex flex-col gap-2">
            <Label htmlFor="email-2">Email</Label>
            <Input type="email" id="email-2" placeholder="Email" />
          </div>
        </section>

        {/* Menubar */}
        <section id="menubar" className="rounded-lg border p-6">
          <h2 className="mb-4 text-2xl font-bold">Menubar</h2>
          <Menubar>
            <MenubarMenu>
              <MenubarTrigger>File</MenubarTrigger>
              <MenubarContent>
                <MenubarItem>New Tab</MenubarItem>
                <MenubarItem>New Window</MenubarItem>
                <MenubarSeparator />
                <MenubarItem>Share</MenubarItem>
                <MenubarSeparator />
                <MenubarItem>Print</MenubarItem>
              </MenubarContent>
            </MenubarMenu>
            <MenubarMenu>
              <MenubarTrigger>Edit</MenubarTrigger>
              <MenubarContent>
                <MenubarItem>Undo</MenubarItem>
                <MenubarItem>Redo</MenubarItem>
                <MenubarSeparator />
                <MenubarItem>Cut</MenubarItem>
                <MenubarItem>Copy</MenubarItem>
                <MenubarItem>Paste</MenubarItem>
              </MenubarContent>
            </MenubarMenu>
            <MenubarMenu>
              <MenubarTrigger>View</MenubarTrigger>
              <MenubarContent>
                <MenubarItem>Actual Size</MenubarItem>
                <MenubarItem>Zoom In</MenubarItem>
                <MenubarItem>Zoom Out</MenubarItem>
              </MenubarContent>
            </MenubarMenu>
          </Menubar>
        </section>

        {/* Navigation Menu */}
        <section id="navigation-menu" className="rounded-lg border p-6">
          <h2 className="mb-4 text-2xl font-bold">Navigation Menu</h2>
          <NavigationMenu>
            <NavigationMenuList>
              <NavigationMenuItem>
                <NavigationMenuTrigger>Getting started</NavigationMenuTrigger>
                <NavigationMenuContent>
                  <ul className="grid gap-3 p-4 md:w-[400px] lg:w-[500px] lg:grid-cols-[.75fr_1fr]">
                    <li className="row-span-3">
                      <NavigationMenuLink asChild>
                        <a
                          className="from-muted/50 to-muted flex h-full w-full flex-col justify-end rounded-md bg-gradient-to-b p-6 no-underline outline-none select-none focus:shadow-md"
                          href="/"
                        >
                          <div className="mt-4 mb-2 text-lg font-medium">
                            shadcn/ui
                          </div>
                          <p className="text-muted-foreground text-sm leading-tight">
                            Beautifully designed components
                          </p>
                        </a>
                      </NavigationMenuLink>
                    </li>
                    <li>
                      <NavigationMenuLink asChild>
                        <a
                          className="hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground block space-y-1 rounded-md p-3 leading-none no-underline transition-colors outline-none select-none"
                          href="/"
                        >
                          <div className="text-sm leading-none font-medium">
                            Introduction
                          </div>
                          <p className="text-muted-foreground line-clamp-2 text-sm leading-snug">
                            Re-usable components built using Radix UI and
                            Tailwind CSS.
                          </p>
                        </a>
                      </NavigationMenuLink>
                    </li>
                  </ul>
                </NavigationMenuContent>
              </NavigationMenuItem>
              <NavigationMenuItem>
                <NavigationMenuTrigger>Components</NavigationMenuTrigger>
                <NavigationMenuContent>
                  <ul className="grid w-[400px] gap-3 p-4 md:w-[500px] md:grid-cols-2 lg:w-[600px]">
                    <li>
                      <NavigationMenuLink asChild>
                        <a
                          className="hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground block space-y-1 rounded-md p-3 leading-none no-underline transition-colors outline-none select-none"
                          href="/"
                        >
                          <div className="text-sm leading-none font-medium">
                            Alert Dialog
                          </div>
                          <p className="text-muted-foreground line-clamp-2 text-sm leading-snug">
                            A modal dialog that interrupts the user with
                            important content.
                          </p>
                        </a>
                      </NavigationMenuLink>
                    </li>
                    <li>
                      <NavigationMenuLink asChild>
                        <a
                          className="hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground block space-y-1 rounded-md p-3 leading-none no-underline transition-colors outline-none select-none"
                          href="/"
                        >
                          <div className="text-sm leading-none font-medium">
                            Hover Card
                          </div>
                          <p className="text-muted-foreground line-clamp-2 text-sm leading-snug">
                            For sighted users to preview content available
                            behind a link.
                          </p>
                        </a>
                      </NavigationMenuLink>
                    </li>
                  </ul>
                </NavigationMenuContent>
              </NavigationMenuItem>
            </NavigationMenuList>
          </NavigationMenu>
        </section>

        {/* Pagination */}
        <section id="pagination" className="rounded-lg border p-6">
          <h2 className="mb-4 text-2xl font-bold">Pagination</h2>
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious href="#" />
              </PaginationItem>
              <PaginationItem>
                <PaginationLink href="#">1</PaginationLink>
              </PaginationItem>
              <PaginationItem>
                <PaginationLink href="#" isActive>
                  2
                </PaginationLink>
              </PaginationItem>
              <PaginationItem>
                <PaginationLink href="#">3</PaginationLink>
              </PaginationItem>
              <PaginationItem>
                <PaginationEllipsis />
              </PaginationItem>
              <PaginationItem>
                <PaginationNext href="#" />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </section>

        {/* Popover */}
        <section id="popover" className="rounded-lg border p-6">
          <h2 className="mb-4 text-2xl font-bold">Popover</h2>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline">Open Popover</Button>
            </PopoverTrigger>
            <PopoverContent className="w-80">
              <div className="grid gap-4">
                <div className="space-y-2">
                  <h4 className="leading-none font-medium">Dimensions</h4>
                  <p className="text-muted-foreground text-sm">
                    Set the dimensions for the layer.
                  </p>
                </div>
                <div className="grid gap-2">
                  <div className="grid grid-cols-3 items-center gap-4">
                    <Label htmlFor="width">Width</Label>
                    <Input
                      id="width"
                      defaultValue="100%"
                      className="col-span-2 h-8"
                    />
                  </div>
                  <div className="grid grid-cols-3 items-center gap-4">
                    <Label htmlFor="height">Height</Label>
                    <Input
                      id="height"
                      defaultValue="25px"
                      className="col-span-2 h-8"
                    />
                  </div>
                </div>
              </div>
            </PopoverContent>
          </Popover>
        </section>

        {/* Progress */}
        <section id="progress" className="rounded-lg border p-6">
          <h2 className="mb-4 text-2xl font-bold">Progress</h2>
          <Progress value={33} className="w-[60%]" />
        </section>

        {/* Radio Group */}
        <section id="radio-group" className="rounded-lg border p-6">
          <h2 className="mb-4 text-2xl font-bold">Radio Group</h2>
          <RadioGroup defaultValue="comfortable">
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="default" id="r1" />
              <Label htmlFor="r1">Default</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="comfortable" id="r2" />
              <Label htmlFor="r2">Comfortable</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="compact" id="r3" />
              <Label htmlFor="r3">Compact</Label>
            </div>
          </RadioGroup>
        </section>

        {/* Resizable */}
        <section id="resizable" className="rounded-lg border p-6">
          <h2 className="mb-4 text-2xl font-bold">Resizable</h2>
          <div className="w-full">
            <ResizablePanelGroup
              direction="horizontal"
              className="min-h-[200px] max-w-md rounded-lg border"
            >
              <ResizablePanel defaultSize={50}>
                <div className="flex h-full items-center justify-center p-6">
                  <span className="font-semibold">One</span>
                </div>
              </ResizablePanel>
              <ResizableHandle />
              <ResizablePanel defaultSize={50}>
                <div className="flex h-full items-center justify-center p-6">
                  <span className="font-semibold">Two</span>
                </div>
              </ResizablePanel>
            </ResizablePanelGroup>
          </div>
        </section>

        {/* Scroll Area */}
        <section id="scroll-area" className="rounded-lg border p-6">
          <h2 className="mb-4 text-2xl font-bold">Scroll Area</h2>
          <ScrollArea className="h-[200px] w-[350px] rounded-md border p-4">
            <div className="space-y-4">
              <h4 className="text-sm leading-none font-medium">
                Radix Primitives
              </h4>
              <p className="text-sm">
                An open-source UI component library for building high-quality,
                accessible design systems and web apps.
              </p>
              <p className="text-sm">
                Radix Primitives is a low-level UI component library with a
                focus on accessibility, customization, and developer experience.
                It provides the foundational building blocks for creating a
                design system.
              </p>
              <p className="text-sm">
                Each primitive focuses on delivering one specific interaction
                pattern. They are designed to be composable with one another and
                complementary to your existing tech stack.
              </p>
              <p className="text-sm">
                An open-source UI component library for building high-quality,
                accessible design systems and web apps.
              </p>
              <p className="text-sm">
                Radix Primitives is a low-level UI component library with a
                focus on accessibility, customization, and developer experience.
                It provides the foundational building blocks for creating a
                design system.
              </p>
              <p className="text-sm">
                Each primitive focuses on delivering one specific interaction
                pattern. They are designed to be composable with one another and
                complementary to your existing tech stack.
              </p>
            </div>
          </ScrollArea>
        </section>

        {/* Select */}
        <section id="select" className="rounded-lg border p-6">
          <h2 className="mb-4 text-2xl font-bold">Select</h2>
          <Select>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select a fruit" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectLabel>Fruits</SelectLabel>
                <SelectItem value="apple">Apple</SelectItem>
                <SelectItem value="banana">Banana</SelectItem>
                <SelectItem value="orange">Orange</SelectItem>
                <SelectItem value="grape">Grape</SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>
        </section>

        {/* Separator */}
        <section id="separator" className="rounded-lg border p-6">
          <h2 className="mb-4 text-2xl font-bold">Separator</h2>
          <div className="space-y-1">
            <h4 className="text-sm leading-none font-medium">
              Radix Primitives
            </h4>
            <p className="text-muted-foreground text-sm">
              An open-source UI component library.
            </p>
            <Separator className="my-4" />
            <div className="flex h-5 items-center space-x-4 text-sm">
              <div>Blog</div>
              <Separator orientation="vertical" />
              <div>Docs</div>
              <Separator orientation="vertical" />
              <div>Source</div>
            </div>
          </div>
        </section>

        {/* Sheet */}
        <section id="sheet" className="rounded-lg border p-6">
          <h2 className="mb-4 text-2xl font-bold">Sheet</h2>
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline">Open Sheet</Button>
            </SheetTrigger>
            <SheetContent>
              <SheetHeader>
                <SheetTitle>Edit profile</SheetTitle>
                <SheetDescription>
                  Make changes to your profile here. Click save when you&apos;re
                  done.
                </SheetDescription>
              </SheetHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="name-sheet" className="text-right">
                    Name
                  </Label>
                  <Input
                    id="name-sheet"
                    value="Pedro Duarte"
                    className="col-span-3"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="username-sheet" className="text-right">
                    Username
                  </Label>
                  <Input
                    id="username-sheet"
                    value="@peduarte"
                    className="col-span-3"
                  />
                </div>
              </div>
              <SheetFooter>
                <SheetClose asChild>
                  <Button type="submit">Save changes</Button>
                </SheetClose>
              </SheetFooter>
            </SheetContent>
          </Sheet>
        </section>

        {/* Skeleton */}
        <section id="skeleton" className="rounded-lg border p-6">
          <h2 className="mb-4 text-2xl font-bold">Skeleton</h2>
          <div className="flex items-center space-x-4">
            <Skeleton className="h-12 w-12 rounded-full" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-[250px]" />
              <Skeleton className="h-4 w-[200px]" />
            </div>
          </div>
        </section>

        {/* Slider */}
        <section id="slider" className="rounded-lg border p-6">
          <h2 className="mb-4 text-2xl font-bold">Slider</h2>
          <Slider
            defaultValue={[50]}
            max={100}
            step={1}
            className="w-[60%]"
            onValueChange={(val) => setPosition(val[0] as any)}
          />
          <div className="mt-2">Value: {position}</div>
        </section>

        {/* Switch */}
        <section id="switch" className="rounded-lg border p-6">
          <h2 className="mb-4 text-2xl font-bold">Switch</h2>
          <div className="flex items-center space-x-2">
            <Switch id="airplane-mode" />
            <Label htmlFor="airplane-mode">Airplane Mode</Label>
          </div>
        </section>

        {/* Table */}
        <section id="table" className="rounded-lg border p-6">
          <h2 className="mb-4 text-2xl font-bold">Table</h2>
          <Table>
            <TableCaption>A list of your recent invoices.</TableCaption>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[100px]">Invoice</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Method</TableHead>
                <TableHead className="text-right">Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell className="font-medium">INV001</TableCell>
                <TableCell>Paid</TableCell>
                <TableCell>Credit Card</TableCell>
                <TableCell className="text-right">$250.00</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">INV002</TableCell>
                <TableCell>Pending</TableCell>
                <TableCell>PayPal</TableCell>
                <TableCell className="text-right">$150.00</TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">INV003</TableCell>
                <TableCell>Processing</TableCell>
                <TableCell>Bank Transfer</TableCell>
                <TableCell className="text-right">$350.00</TableCell>
              </TableRow>
            </TableBody>
            <TableFooter>
              <TableRow>
                <TableCell colSpan={3}>Total</TableCell>
                <TableCell className="text-right">$750.00</TableCell>
              </TableRow>
            </TableFooter>
          </Table>
        </section>

        {/* Tabs */}
        <section id="tabs" className="rounded-lg border p-6">
          <h2 className="mb-4 text-2xl font-bold">Tabs</h2>
          <Tabs defaultValue="account" className="w-[400px]">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="account">Account</TabsTrigger>
              <TabsTrigger value="password">Password</TabsTrigger>
            </TabsList>
            <TabsContent value="account">
              <Card>
                <CardHeader>
                  <CardTitle>Account</CardTitle>
                  <CardDescription>
                    Make changes to your account here. Click save when
                    you&apos;re done.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="space-y-1">
                    <Label htmlFor="name-tabs">Name</Label>
                    <Input id="name-tabs" defaultValue="Pedro Duarte" />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="username-tabs">Username</Label>
                    <Input id="username-tabs" defaultValue="@peduarte" />
                  </div>
                </CardContent>
                <CardFooter>
                  <Button>Save changes</Button>
                </CardFooter>
              </Card>
            </TabsContent>
            <TabsContent value="password">
              <Card>
                <CardHeader>
                  <CardTitle>Password</CardTitle>
                  <CardDescription>
                    Change your password here. After saving, you&apos;ll be
                    logged out.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="space-y-1">
                    <Label htmlFor="current">Current password</Label>
                    <Input id="current" type="password" />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="new">New password</Label>
                    <Input id="new" type="password" />
                  </div>
                </CardContent>
                <CardFooter>
                  <Button>Save password</Button>
                </CardFooter>
              </Card>
            </TabsContent>
          </Tabs>
        </section>

        {/* Textarea */}
        <section id="textarea" className="rounded-lg border p-6">
          <h2 className="mb-4 text-2xl font-bold">Textarea</h2>
          <div className="grid w-full gap-1.5">
            <Label htmlFor="message">Your message</Label>
            <Textarea placeholder="Type your message here." id="message" />
          </div>
        </section>

        {/* Toggle */}
        <section id="toggle" className="rounded-lg border p-6">
          <h2 className="mb-4 text-2xl font-bold">Toggle</h2>
          <Toggle aria-label="Toggle italic">
            <span className="font-bold">B</span>
          </Toggle>
        </section>

        {/* Toggle Group */}
        <section id="toggle-group" className="rounded-lg border p-6">
          <h2 className="mb-4 text-2xl font-bold">Toggle Group</h2>
          <ToggleGroup type="single">
            <ToggleGroupItem value="a" aria-label="Toggle bold">
              <span className="font-bold">B</span>
            </ToggleGroupItem>
            <ToggleGroupItem value="b" aria-label="Toggle italic">
              <span className="italic">I</span>
            </ToggleGroupItem>
            <ToggleGroupItem value="c" aria-label="Toggle underline">
              <span className="underline">U</span>
            </ToggleGroupItem>
          </ToggleGroup>
        </section>

        {/* Tooltip */}
        <section id="tooltip" className="rounded-lg border p-6">
          <h2 className="mb-4 text-2xl font-bold">Tooltip</h2>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline">Hover Me</Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Add to library</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </section>
      </div>
    </div>
  );
};

export default AdminComponentsPage;
